"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  GripVertical,
  X,
  Loader2,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRightLeft,
  Scan,
  Sparkles,
  Search,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Move,
  LayoutGrid,
  Box,
  ArrowRight,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

// --- Types ---
interface Service {
  id: string;
  serviceName: string;
  imageName: string;
}

interface ScanMeta {
  id: string;
  imageTag: string;
  status: string;
  startedAt: string;
  vulnCritical: number;
  vulnHigh: number;
  vulnMedium: number;
  vulnLow: number;
}

interface Finding {
  file: string;
  line: number;
  ruleId: string;
  severity: string;
  message: string;
}

interface ComparisonData {
  scan1: any;
  scan2: any;
  newFindings: Finding[];
  resolvedFindings: Finding[];
  persistentFindings: Finding[];
}

export default function InfiniteCanvasComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");
  const serviceId = searchParams.get("serviceId");

  // Data State
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [historyScans, setHistoryScans] = useState<ScanMeta[]>([]);
  const [leftScan, setLeftScan] = useState<ScanMeta | null>(null);
  const [rightScan, setRightScan] = useState<ScanMeta | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [dragOver, setDragOver] = useState<"left" | "right" | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- CANVAS STATE ---
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // 1. Fetch Services
  useEffect(() => {
    if (projectId && !serviceId) {
      const fetchServices = async () => {
        setLoadingServices(true);
        try {
          const res = await fetch(`/api/projects/${projectId}`);
          if (res.ok) {
            const data = await res.json();
            const projectData = data.project || data;
            setServices(projectData.services || []);
          }
        } catch (error) {
          console.error("Failed to load services", error);
        } finally {
          setLoadingServices(false);
        }
      };
      fetchServices();
    }
  }, [projectId, serviceId]);

  // 2. Fetch History
  useEffect(() => {
    if (serviceId) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const res = await fetch(`/api/scan/history?serviceId=${serviceId}`);
          if (res.ok) {
            const data = await res.json();
            setHistoryScans(data.history || []);
            if (data.history && data.history.length >= 2) {
              setRightScan(data.history[0]);
              setLeftScan(data.history[1]);
            }
          }
        } catch (error) {
          console.error("Failed to load history", error);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    } else {
      setLoadingHistory(false);
    }
  }, [serviceId]);

  // Trigger Compare
  useEffect(() => {
    if (leftScan && rightScan) {
      if (leftScan.id === rightScan.id) return;
      setIsAnalyzing(true);
      setLoading(true);

      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/scan/compare`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scanId1: leftScan.id,
              scanId2: rightScan.id,
            }),
          });
          if (res.ok) setComparison(await res.json());
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }, 600);

      return () => clearTimeout(timer);
    } else {
      setComparison(null);
      setIsAnalyzing(false);
    }
  }, [leftScan, rightScan]);

  // --- CANVAS HANDLERS ---
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || true) {
      e.preventDefault();
      const scaleAmount = -e.deltaY * 0.001;
      const newScale = Math.min(
        Math.max(0.5, transform.scale + scaleAmount),
        3
      );
      setTransform((prev) => ({ ...prev, scale: newScale }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    setTransform((prev) => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsPanning(false);
  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  const handleDragStart = (e: React.DragEvent, scan: ScanMeta) => {
    e.dataTransfer.setData("scan", JSON.stringify(scan));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (e: React.DragEvent, side: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    const data = e.dataTransfer.getData("scan");
    if (data) {
      const scan = JSON.parse(data);
      if (side === "left") setLeftScan(scan);
      else setRightScan(scan);
    }
  };

  // --- RENDER 1: SERVICE SELECTION ---
  if (!serviceId && projectId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-start pt-24 p-8">
        <div className="max-w-4xl w-full">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-sm border border-indigo-100">
              <LayoutGrid className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Select Service to Compare
            </h1>
            <p className="text-slate-500 mt-2">
              Choose a service to open the comparison workspace
            </p>
          </div>
          {loadingServices ? (
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() =>
                    router.push(
                      `/scan/compare?serviceId=${service.id}&projectId=${projectId}`
                    )
                  }
                  className="group flex flex-col items-start p-6 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className="p-3 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 mb-4 transition-colors">
                    <Box className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    {service.serviceName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {service.imageName}
                  </p>
                  <div className="mt-4 flex items-center text-xs font-medium text-slate-400 group-hover:text-indigo-500">
                    Open Workspace{" "}
                    <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER 2: CANVAS VIEW ---
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-30 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-5 py-4 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors border-b border-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />{" "}
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
        <div className="p-4 bg-slate-50/50 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm tracking-tight">
            <FileText className="w-4 h-4 text-indigo-600" /> REPORTS
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">Drag to canvas</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 relative custom-scrollbar">
          {loadingHistory ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-indigo-500" />
            </div>
          ) : (
            historyScans.map((scan, idx) => (
              <div
                key={scan.id}
                draggable
                onDragStart={(e) => handleDragStart(e, scan)}
                className="group relative bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 cursor-grab active:cursor-grabbing transition-all duration-200"
              >
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-400 transition-colors">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="pl-6">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200 transition-colors truncate max-w-[140px]">
                      {scan.imageTag || "No Tag"}
                    </span>
                    {idx === 0 && (
                      <span className="text-[8px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-sm">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mb-2 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />{" "}
                    {new Date(scan.startedAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-1">
                    <SeverityDot count={scan.vulnCritical || 0} color="red" />
                    <SeverityDot count={scan.vulnHigh || 0} color="orange" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Canvas */}
      <main
        ref={canvasRef}
        className={`flex-1 relative overflow-hidden bg-[#F1F5F9] ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            className="absolute -inset-[5000px] opacity-[0.4]"
            style={{
              backgroundImage: "radial-gradient(#94A3B8 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          ></div>
        </div>

        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center pointer-events-none">
          <div
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transition: isPanning ? "none" : "transform 0.1s ease-out",
            }}
            className="pointer-events-auto flex gap-12 items-start"
          >
            {/* --- LEFT PAPER (BASELINE) --- */}
            <CanvasDropFrame
              side="left"
              scan={leftScan}
              isOver={dragOver === "left"}
              onDrop={handleDrop}
              setDragOver={setDragOver}
              onClear={() => setLeftScan(null)}
              title="BASELINE VERSION"
            >
              {leftScan && (
                <A4PaperContent scan={leftScan}>
                  {comparison ? (
                    <div className="space-y-6 font-mono text-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Differences
                        </span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                          ReadOnly
                        </span>
                      </div>

                      {/* 🟢 Resolved: Show Badge crossed out but readable */}
                      {comparison.resolvedFindings.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">
                            Resolved (Fixed)
                          </div>
                          {comparison.resolvedFindings.map((f, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-start opacity-70 hover:opacity-100 transition group p-2 -mx-2 rounded hover:bg-emerald-50/50 border border-transparent hover:border-emerald-100"
                            >
                              <div className="line-through decoration-emerald-400 decoration-2 text-slate-500 group-hover:text-slate-700 transition-colors w-full">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-xs">
                                    {f.file}
                                  </span>
                                  <Badge severity={f.severity} />
                                </div>
                                <div className="text-[10px] opacity-70">
                                  {f.ruleId}
                                </div>
                              </div>
                              <span className="ml-2 text-[9px] font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 py-1 rounded whitespace-nowrap">
                                FIXED
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 🟡 Persistent: Show Colored Card */}
                      {comparison.persistentFindings.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                            Persistent (Baseline)
                          </div>
                          <div className="space-y-2">
                            {comparison.persistentFindings.map((f, i) => (
                              <div
                                key={i}
                                className={`p-2 rounded border-l-4 text-xs ${
                                  f.severity === "CRITICAL"
                                    ? "bg-red-50 border-red-500"
                                    : f.severity === "HIGH"
                                    ? "bg-orange-50 border-orange-500"
                                    : "bg-slate-50 border-slate-300"
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-bold text-slate-700 break-all">
                                    {f.file}
                                  </span>
                                  <Badge severity={f.severity} />
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {f.ruleId}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                      Waiting for target...
                    </div>
                  )}
                </A4PaperContent>
              )}
            </CanvasDropFrame>

            {/* Connector */}
            <div
              className={`self-center transition-all duration-500 mt-32 ${
                isAnalyzing ? "opacity-100 w-24" : "opacity-30 w-16 grayscale"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute h-0.5 w-full bg-slate-300"></div>
                {isAnalyzing && (
                  <div className="absolute h-0.5 w-full bg-indigo-500 animate-pulse"></div>
                )}
                <div
                  className={`relative z-10 bg-white p-3 rounded-full border-2 shadow-sm transition-all duration-300 ${
                    isAnalyzing
                      ? "border-indigo-500 text-indigo-600 scale-110 shadow-indigo-100"
                      : "border-slate-300 text-slate-300"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>

            {/* --- RIGHT PAPER (TARGET) --- */}
            <CanvasDropFrame
              side="right"
              scan={rightScan}
              isOver={dragOver === "right"}
              onDrop={handleDrop}
              setDragOver={setDragOver}
              onClear={() => setRightScan(null)}
              title="TARGET VERSION"
            >
              {rightScan && (
                <A4PaperContent scan={rightScan} isNew={true}>
                  {comparison ? (
                    <div className="space-y-5 font-mono text-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-indigo-100">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                          Detected Changes
                        </span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">
                          {comparison.newFindings.length} New
                        </span>
                      </div>

                      {/* 🔴 New Findings */}
                      {comparison.newFindings.length > 0 ? (
                        <div className="space-y-3">
                          {comparison.newFindings.map((f, i) => (
                            <div
                              key={i}
                              className={`relative p-3 -mx-2 rounded-md shadow-sm transition-transform hover:scale-[1.01] border ${
                                f.severity === "CRITICAL"
                                  ? "bg-red-50 border-red-200"
                                  : f.severity === "HIGH"
                                  ? "bg-orange-50 border-orange-200"
                                  : "bg-[#FFFBEB] border-yellow-200"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div className="text-slate-800 font-bold text-xs break-all pr-2">
                                  {f.file}{" "}
                                  <span className="text-slate-400 font-normal">
                                    :{f.line}
                                  </span>
                                </div>
                                <Badge severity={f.severity} />
                              </div>
                              <div className="text-[10px] font-bold text-slate-500 mb-1">
                                {f.ruleId}
                              </div>
                              <div className="text-[11px] text-slate-600 leading-relaxed border-l-2 pl-2 border-black/10">
                                {f.message}
                              </div>
                              <div className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[8px] font-bold px-1.5 rounded shadow-sm">
                                NEW
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center border-2 border-dashed border-slate-100 rounded-lg">
                          {/* <CheckCircle2 className="w-8 h-8 text-emerald-200 mx-auto mb-2" /> */}
                          <p className="text-xs text-slate-400">
                            No new vulnerabilities.
                          </p>
                        </div>
                      )}

                      {/* 🟡 Persistent (Target Context) */}
                      {comparison.persistentFindings.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                            Persistent (Still Present)
                          </div>
                          <div className="space-y-2">
                            {comparison.persistentFindings.map((f, i) => (
                              <div
                                key={i}
                                className={`p-2 rounded border-l-4 text-xs ${
                                  f.severity === "CRITICAL"
                                    ? "bg-red-50 border-red-500"
                                    : f.severity === "HIGH"
                                    ? "bg-orange-50 border-orange-500"
                                    : "bg-slate-50 border-slate-300"
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-bold text-slate-700 break-all">
                                    {f.file}
                                  </span>
                                  <Badge severity={f.severity} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                      Waiting for analysis...
                    </div>
                  )}
                </A4PaperContent>
              )}
            </CanvasDropFrame>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-30">
          <button
            onClick={() =>
              setTransform((prev) => ({
                ...prev,
                scale: Math.min(prev.scale + 0.1, 3),
              }))
            }
            className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={resetView}
            className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
          >
            <Maximize className="w-5 h-5" />
          </button>
          <button
            onClick={() =>
              setTransform((prev) => ({
                ...prev,
                scale: Math.max(prev.scale - 0.1, 0.5),
              }))
            }
            className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>
        {!isPanning && transform.x === 0 && transform.y === 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none animate-pulse bg-slate-900/10 px-4 py-2 rounded-full text-xs text-slate-500 flex items-center gap-2">
            <Move className="w-4 h-4" /> Scroll to Zoom • Drag to Pan
          </div>
        )}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---
const CanvasDropFrame = ({
  children,
  side,
  scan,
  isOver,
  onDrop,
  setDragOver,
  onClear,
  title,
}: any) => {
  const frameStyle = isOver
    ? "border-indigo-400 bg-indigo-50/50 shadow-lg scale-[1.01]"
    : scan
    ? "border-transparent"
    : "border-slate-300 border-dashed bg-white/50 hover:border-indigo-300 hover:bg-white";
  return (
    <div
      onDrop={(e) => onDrop(e, side)}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(side);
      }}
      onDragLeave={() => setDragOver(null)}
      className={`relative w-[550px] h-[780px] rounded-xl transition-all duration-300 ease-out border-2 flex flex-col ${frameStyle}`}
    >
      {!scan && (
        <>
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-300"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-300"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-300"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-300"></div>
        </>
      )}
      {scan ? (
        <div className="contents animate-in fade-in zoom-in-95 duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-md border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all z-20 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          {children}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center relative overflow-hidden select-none">
          <div
            className={`p-4 rounded-full bg-slate-100 mb-4 transition-transform duration-300 ${
              isOver ? "scale-110 bg-indigo-100 text-indigo-500" : ""
            }`}
          >
            <Scan className="w-8 h-8" />
          </div>
          <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-slate-500 mb-1">
            {title}
          </h3>
          <p className="text-[10px] text-slate-400">
            {isOver ? "Release to place report" : "Drag & drop report here"}
          </p>
        </div>
      )}
    </div>
  );
};

const A4PaperContent = ({ children, scan, isNew }: any) => (
  <div className="flex-1 flex flex-col overflow-hidden rounded-sm bg-white relative shadow-xl h-full border border-slate-200 select-text cursor-auto">
    <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0 bg-white">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight font-mono">
            {scan.imageTag}
          </h2>
          {isNew && (
            <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-50" />
          )}
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono uppercase tracking-wide">
          <Clock className="w-3 h-3" />
          {new Date(scan.startedAt).toLocaleString()}
        </div>
      </div>
      <div className="flex flex-col gap-1 items-end">
        {scan.vulnCritical > 0 && (
          <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
            CRITICAL: {scan.vulnCritical}
          </span>
        )}
        {scan.vulnHigh > 0 && (
          <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
            HIGH: {scan.vulnHigh}
          </span>
        )}
      </div>
    </div>
    <div
      className="p-6 flex-1 overflow-y-auto custom-scrollbar relative"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
    <div className="h-8 border-t border-slate-100 flex justify-between items-center px-6 text-[8px] text-slate-400 font-mono bg-slate-50/50 shrink-0 uppercase tracking-widest">
      <span>VisScan Audit // {isNew ? "Target" : "Baseline"}</span>
      <span>ID: {scan.id.slice(0, 8)}</span>
    </div>
  </div>
);

const SeverityDot = ({ count, color }: any) => {
  if (count === 0) return null;
  const bg = color === "red" ? "bg-red-500" : "bg-orange-500";
  return (
    <span className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
      <span className={`w-1.5 h-1.5 rounded-full ${bg}`}></span> {count}
    </span>
  );
};
const Badge = ({ severity }: any) => {
  const colors: any = {
    CRITICAL: "text-red-700 bg-red-50 border-red-200",
    HIGH: "text-orange-700 bg-orange-50 border-orange-200",
    MEDIUM: "text-yellow-700 bg-yellow-50 border-yellow-200",
    LOW: "text-blue-700 bg-blue-50 border-blue-200",
  };
  return (
    <span
      className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${
        colors[severity?.toUpperCase()] || "text-slate-600 bg-slate-100"
      }`}
    >
      {severity}
    </span>
  );
};
