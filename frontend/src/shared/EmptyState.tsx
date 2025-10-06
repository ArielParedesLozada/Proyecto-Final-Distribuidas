import React from "react";

type IconComp = React.ComponentType<{ className?: string }>;

type Props = {
    icon?: IconComp;
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    size?: "sm" | "md" | "lg";
    align?: "center" | "left";
    asCard?: boolean;
    className?: string;
};

const SIZE = {
    sm: { icon: "w-8 h-8", title: "text-base", desc: "text-xs", pad: "py-6" },
    md: { icon: "w-12 h-12", title: "text-lg", desc: "text-sm", pad: "py-10" },
    lg: { icon: "w-16 h-16", title: "text-xl", desc: "text-base", pad: "py-14" },
} as const;

const EmptyState: React.FC<Props> = ({
    icon: Icon,
    title,
    description,
    action,
    size = "md",
    align = "center",
    asCard = false,
    className = "",
}) => {
    const s = SIZE[size];

    const inner = (
        <div
            className={[
                s.pad,
                align === "center" ? "text-center flex flex-col items-center justify-center" : "",
                className,
            ].join(" ")}
        >
            {Icon && <Icon className={`${s.icon} text-slate-500 mx-auto mb-3`} />}
            <div className={`font-medium text-slate-300 ${s.title}`}>{title}</div>
            {description && <div className={`text-slate-500 ${s.desc} mt-1`}>{description}</div>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );

    if (asCard) {
        return <div className="fuel-card p-6">{inner}</div>;
    }
    return inner;
};

export default EmptyState;
