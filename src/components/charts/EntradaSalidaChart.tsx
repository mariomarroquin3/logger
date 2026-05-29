// ============================================================
// components/charts/EntradaSalidaChart.tsx
// Gráfica donut: Entradas vs Salidas
// ============================================================
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { EntradaSalidaData } from '../../types';

interface Props {
  data: EntradaSalidaData;
}

const COLORS = ['#10b981', '#3b82f6'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-white">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{payload[0].value}</p>
    </div>
  );
};

const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex justify-center gap-5 mt-2">
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </div>
      ))}
    </div>
  );
};

export function EntradaSalidaChart({ data }: Props) {
  const chartData = [
    { name: 'Entradas', value: data.entradas, fill: COLORS[0] },
    { name: 'Salidas',  value: data.salidas,  fill: COLORS[1] },
  ];

  const total = data.entradas + data.salidas;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
      {/* Centro del donut */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-10px' }}>
        <p className="text-2xl font-bold text-white">{total}</p>
        <p className="text-[10px] text-gray-500">total</p>
      </div>
    </div>
  );
}
