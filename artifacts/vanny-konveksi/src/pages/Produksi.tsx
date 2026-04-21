import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, CalendarDays, Package } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface ProductionTask {
  id: string;
  order_id: string | null;
  order_customer: string;
  order_desc: string;
  stage: "antrian" | "cutting" | "jahit" | "finishing";
  progress: number;
  deadline: string | null;
  assigned_initials: string[];
}

type Stage = "antrian" | "cutting" | "jahit" | "finishing";

const STAGES: { id: Stage; label: string; color: string; headerColor: string }[] = [
  { id: "antrian",  label: "Antrian",  color: "bg-gray-100",   headerColor: "bg-gray-500" },
  { id: "cutting",  label: "Cutting",  color: "bg-teal-50",    headerColor: "bg-teal-600" },
  { id: "jahit",    label: "Jahit",    color: "bg-amber-50",   headerColor: "bg-amber-500" },
  { id: "finishing",label: "Finishing",color: "bg-emerald-50", headerColor: "bg-emerald-600" },
];

const AVATAR_COLORS = [
  "bg-teal-600", "bg-blue-600", "bg-violet-600",
  "bg-amber-600", "bg-emerald-600", "bg-pink-600",
];

function KanbanCard({ task, onMoveStage }: { task: ProductionTask; onMoveStage: (id: string, stage: Stage) => void }) {
  const stageIdx = STAGES.findIndex((s) => s.id === task.stage);
  const canAdvance = stageIdx < STAGES.length - 1;
  const canBack    = stageIdx > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-xl border border-black/[0.07] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      <div className="flex justify-between items-start mb-2.5">
        <span className="text-[11px] font-mono font-semibold text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
          {task.order_id ?? "—"}
        </span>
        {task.deadline && (
          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />{task.deadline}
          </span>
        )}
      </div>

      <h4 className="font-semibold text-gray-900 text-sm mb-0.5">{task.order_customer}</h4>
      <p className="text-xs text-muted-foreground mb-3">{task.order_desc}</p>

      <div className="mb-3">
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-muted-foreground font-medium">Progress</span>
          <span className="font-semibold text-gray-700">{task.progress}%</span>
        </div>
        <Progress value={task.progress} className="h-1.5 bg-gray-100" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {task.assigned_initials.slice(0, 4).map((init, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} border-2 border-white flex items-center justify-center text-[9px] font-bold text-white`}
              title={init}
            >
              {init}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {canBack && (
            <button
              onClick={() => onMoveStage(task.id, STAGES[stageIdx - 1].id)}
              className="text-[10px] px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              ← Kembali
            </button>
          )}
          {canAdvance && (
            <button
              onClick={() => onMoveStage(task.id, STAGES[stageIdx + 1].id)}
              className="text-[10px] px-2 py-1 rounded border border-teal-200 text-teal-700 hover:bg-teal-50 transition-colors font-medium"
            >
              Lanjut →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Produksi() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("production_tasks").select("*").order("created_at");
    if (data) setTasks(data as ProductionTask[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleMoveStage = async (id: string, newStage: Stage) => {
    const progressMap: Record<Stage, number> = { antrian: 0, cutting: 25, jahit: 60, finishing: 90 };
    const { error } = await supabase
      .from("production_tasks")
      .update({ stage: newStage, progress: progressMap[newStage] })
      .eq("id", id);
    if (error) { toast({ title: "Gagal update", variant: "destructive" }); return; }
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, stage: newStage, progress: progressMap[newStage] } : t));
    toast({ title: `Task dipindah ke ${newStage}` });
  };

  const totalByStage = STAGES.reduce((acc, s) => {
    acc[s.id] = tasks.filter((t) => t.stage === s.id).length;
    return acc;
  }, {} as Record<Stage, number>);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Papan Produksi</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Pantau dan kelola alur produksi dengan kanban.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTasks} className="border-gray-200 h-9 rounded-lg gap-1.5">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3">
          {STAGES.map((stage) => (
            <div key={stage.id} className="bg-white rounded-xl border border-black/[0.07] shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${stage.headerColor}`} />
                <p className="text-xs font-medium text-muted-foreground">{stage.label}</p>
              </div>
              <p className="text-2xl font-display font-bold text-gray-900">{totalByStage[stage.id]}</p>
              <p className="text-[11px] text-muted-foreground">task</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {STAGES.map((stage) => {
              const stageTasks = tasks.filter((t) => t.stage === stage.id);
              return (
                <div key={stage.id} className={`rounded-xl ${stage.color} p-3 space-y-3`}>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.headerColor}`} />
                      <h3 className="text-sm font-semibold text-gray-800">{stage.label}</h3>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">
                      {stageTasks.length}
                    </span>
                  </div>

                  {stageTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package className="h-7 w-7 text-gray-300 mb-2" />
                      <p className="text-xs text-gray-400">Tidak ada task</p>
                    </div>
                  ) : (
                    stageTasks.map((task) => (
                      <KanbanCard key={task.id} task={task} onMoveStage={handleMoveStage} />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
