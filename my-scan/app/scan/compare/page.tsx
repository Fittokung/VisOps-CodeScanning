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
  CheckCircle,
  ZoomIn,
  ZoomOut,
  Maximize,
  Move,
  LayoutGrid,
  Box,
  ArrowRight,
  AlertCircle,
  Package,
  Hash,
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
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.9 }); // Start zoomed out slightly
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
        Math.max(0.4, transform.scale + scaleAmount),
        2.5
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
  const resetView = () => setTransform({ x: 0, y: 0, scale: 0.9 });

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
      <div className="w-full max-w-6xl mx-auto py-12">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-6 shadow-sm border border-indigo-100">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Compare Workspace
          </h1>
          <p className="text-slate-500 mt-3 max-w-lg">
            Select a service to enter the infinite canvas comparison mode. Drag
            and drop scan reports to visualize differences.
          </p>
        </div>

        {loadingServices ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() =>
                  router.push(
                    `/scan/compare?serviceId=${service.id}&projectId=${projectId}`
                  )
                }
                className="group flex flex-col items-start p-6 bg-white rounded-xl border-2 border-slate-100 hover:border-indigo-500/50 hover:shadow-lg transition-all duration-300 text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="text-indigo-500 w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                </div>

                <div className="p-3 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 mb-4 transition-colors">
                  <Box className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-700 transition-colors">
                  {service.serviceName}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono bg-slate-50 px-2 py-1 rounded">
                  {service.imageName}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- RENDER 2: CANVAS VIEW (Inside Layout) ---
  return (
    <div className="flex flex-col h-full w-full">
      {/* Page Header (Minimal) */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="text-indigo-600 w-6 h-6" /> Compare Scans
          </h1>
          <p className="text-sm text-gray-500">
            Drag and drop reports to compare findings
          </p>
        </div>
        <Link
          href={`/scan/compare?projectId=${projectId}`}
          className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <LayoutGrid size={14} /> Switch Service
        </Link>
      </div>

      {/* ✅ Application Frame: This mimics a window inside the dashboard */}
      <div className="flex flex-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white h-[calc(100vh-10rem)]">
        {/* Left Sidebar: Report List */}
        <aside className="w-64 bg-slate-50/50 border-r border-slate-200 flex flex-col z-10 shrink-0">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4 text-indigo-600" /> Available Reports
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 relative custom-scrollbar">
            {loadingHistory ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-indigo-500 w-6 h-6" />
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
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-mono font-bold text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200 transition-colors truncate max-w-[120px]">
                        {scan.imageTag || "latest"}
                      </span>
                      {idx === 0 && (
                        <span className="text-[8px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-sm">
                          LATEST
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mb-2 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
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

        {/* Right Area: Infinite Canvas */}
        <div className="flex-1 relative bg-[#F8FAFC] overflow-hidden">
          {/* Canvas Controls (Floating) */}
          <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
            <div className="bg-white p-1 rounded-lg shadow-md border border-slate-200 flex flex-col">
              <button
                onClick={() =>
                  setTransform((prev) => ({
                    ...prev,
                    scale: Math.min(prev.scale + 0.1, 3),
                  }))
                }
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <div className="h-px bg-slate-200 mx-2" />
              <button
                onClick={() =>
                  setTransform((prev) => ({
                    ...prev,
                    scale: Math.max(prev.scale - 0.1, 0.4),
                  }))
                }
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
            </div>
            <button
              onClick={resetView}
              className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
              title="Reset View"
            >
              <Maximize size={18} />
            </button>
          </div>

          {/* Canvas Interactions */}
          <div
            ref={canvasRef}
            className={`w-full h-full ${
              isPanning ? "cursor-grabbing" : "cursor-grab"
            }`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid Background */}
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
                className="absolute -inset-[5000px] opacity-[0.5]"
                style={{
                  backgroundImage:
                    "radial-gradient(#CBD5E1 1.5px, transparent 0)",
                  backgroundSize: "32px 32px",
                }}
              ></div>
            </div>

            {/* Workspace Content */}
            <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center pointer-events-none">
              <div
                style={{
                  transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                  transition: isPanning ? "none" : "transform 0.1s ease-out",
                }}
                className="pointer-events-auto flex gap-16 items-start"
              >
                {/* --- LEFT PAPER --- */}
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
                              Differences Log
                            </span>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">
                              Read Only
                            </span>
                          </div>

                          {/* Resolved */}
                          {comparison.resolvedFindings.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1 flex items-center gap-1">
                                <CheckCircle size={10} /> Resolved (Fixed)
                              </div>
                              {comparison.resolvedFindings.map((f, i) => (
                                <div
                                  key={i}
                                  className="group p-2 -mx-2 rounded hover:bg-emerald-50/50 border border-transparent hover:border-emerald-100 transition-all"
                                >
                                  <div className="line-through decoration-emerald-400 decoration-2 text-slate-400 group-hover:text-slate-600">
                                    <div className="flex items-center justify-between mb-1">
                                      <span
                                        className="font-bold text-xs truncate max-w-[200px]"
                                        title={f.file}
                                      >
                                        {f.file}
                                      </span>
                                      <Badge severity={f.severity} />
                                    </div>
                                    <div className="text-[10px] opacity-70">
                                      {f.ruleId}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Persistent */}
                          {comparison.persistentFindings.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-100">
                              <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                                Persistent (Baseline)
                              </div>
                              <div className="space-y-2">
                                {comparison.persistentFindings.map((f, i) => (
                                  <div
                                    key={i}
                                    className={`p-2 rounded border-l-2 text-xs ${getSeverityBorder(
                                      f.severity
                                    )} bg-slate-50`}
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
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                          <Loader2 className="w-6 h-6 animate-spin opacity-50" />
                          <span className="text-xs italic">
                            Syncing with target...
                          </span>
                        </div>
                      )}
                    </A4PaperContent>
                  )}
                </CanvasDropFrame>

                {/* Connector Arrow */}
                <div
                  className={`self-center transition-all duration-500 mt-48 ${
                    isAnalyzing
                      ? "opacity-100 w-32"
                      : "opacity-30 w-24 grayscale"
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
                          ? "border-indigo-500 text-indigo-600 scale-125 shadow-indigo-200"
                          : "border-slate-300 text-slate-300"
                      }`}
                    >
                      {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <ArrowRightLeft className="w-6 h-6" />
                      )}
                    </div>
                  </div>
                </div>

                {/* --- RIGHT PAPER --- */}
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
                              Analysis Result
                            </span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold border border-indigo-100">
                              {comparison.newFindings.length} New Findings
                            </span>
                          </div>

                          {/* New Findings */}
                          {comparison.newFindings.length > 0 ? (
                            <div className="space-y-3">
                              {comparison.newFindings.map((f, i) => (
                                <div
                                  key={i}
                                  className={`relative p-3 rounded-lg shadow-sm transition-transform hover:scale-[1.02] border bg-white ${getSeverityStyle(
                                    f.severity
                                  )}`}
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
                                  <div className="text-[11px] text-slate-600 leading-relaxed border-l-2 pl-2 border-slate-200">
                                    {f.message}
                                  </div>
                                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    NEW
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-6 text-center border-2 border-dashed border-emerald-100 bg-emerald-50/30 rounded-xl">
                              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                              <p className="text-sm font-bold text-emerald-700">
                                Clean Sweep!
                              </p>
                              <p className="text-xs text-emerald-600 mt-1">
                                No new vulnerabilities introduced.
                              </p>
                            </div>
                          )}

                          {/* Persistent (Context) */}
                          {comparison.persistentFindings.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-100 opacity-70 hover:opacity-100 transition-opacity">
                              <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                                Persistent (Still Present)
                              </div>
                              <div className="space-y-2">
                                {comparison.persistentFindings.map((f, i) => (
                                  <div
                                    key={i}
                                    className={`p-2 rounded border-l-2 text-xs bg-slate-50 ${getSeverityBorder(
                                      f.severity
                                    )}`}
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

            {!isPanning && transform.x === 0 && transform.y === 0 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none animate-bounce bg-white/80 backdrop-blur px-4 py-2 rounded-full text-xs text-slate-500 flex items-center gap-2 shadow-sm border border-slate-200">
                <Move className="w-4 h-4" /> Scroll to Zoom • Drag to Pan
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS & HELPERS ---

const getSeverityStyle = (sev: string) => {
  switch (sev.toUpperCase()) {
    case "CRITICAL":
      return "border-red-200 bg-red-50/50";
    case "HIGH":
      return "border-orange-200 bg-orange-50/50";
    default:
      return "border-yellow-200 bg-yellow-50/50";
  }
};

const getSeverityBorder = (sev: string) => {
  switch (sev.toUpperCase()) {
    case "CRITICAL":
      return "border-red-500";
    case "HIGH":
      return "border-orange-500";
    default:
      return "border-slate-300";
  }
};

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
    ? "border-indigo-400 bg-indigo-50/50 shadow-lg scale-[1.02]"
    : scan
    ? "border-transparent bg-transparent"
    : "border-slate-300 border-dashed bg-white/50 hover:border-indigo-300 hover:bg-white";

  return (
    <div
      onDrop={(e) => onDrop(e, side)}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(side);
      }}
      onDragLeave={() => setDragOver(null)}
      className={`relative w-[500px] h-[700px] rounded-xl transition-all duration-300 ease-out border-2 flex flex-col ${frameStyle}`}
    >
      {!scan && (
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-400"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-400"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-400"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-400"></div>
        </div>
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
            {isOver ? "Release to drop" : "Drag & drop report here"}
          </p>
        </div>
      )}
    </div>
  );
};

const A4PaperContent = ({ children, scan, isNew }: any) => (
  <div className="flex-1 flex flex-col overflow-hidden rounded-lg bg-white relative shadow-2xl h-full select-text cursor-auto ring-1 ring-slate-900/5">
    <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0 bg-gradient-to-b from-white to-slate-50/30">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-mono">
            {scan.imageTag}
          </h2>
          {isNew && (
            <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-50" />
          )}
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono uppercase tracking-wide">
          <Clock className="w-3 h-3" />{" "}
          {new Date(scan.startedAt).toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-1">
          ID: {scan.id.slice(0, 8)}
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
      className="p-6 flex-1 overflow-y-auto custom-scrollbar relative bg-white"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
    <div className="h-2 bg-slate-50 border-t border-slate-100"></div>
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
