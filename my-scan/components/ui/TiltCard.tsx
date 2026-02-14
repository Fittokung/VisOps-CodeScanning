"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const TiltCard = ({ children, className, onClick }: TiltCardProps) => {
    const [rotate, setRotate] = useState({ x: 0, y: 0 });

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const box = card.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        const centerX = box.width / 2;
        const centerY = box.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        setRotate({ x: rotateX, y: rotateY });
    };

    const onMouseLeave = () => {
        setRotate({ x: 0, y: 0 });
    };

    return (
        <div
            className={cn("transition-transform duration-200 ease-out will-change-transform perspective-1000 transform-style-3d", className)}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            style={{
                transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1, 1, 1)`,
            }}
        >
            {children}
        </div>
    );
};
