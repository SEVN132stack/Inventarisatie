'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  verkopenPerDag: { dag: string; omzet: number }[]
}

export default function DashboardCharts({ verkopenPerDag }: Props) {
  const data = verkopenPerDag.map(d => ({
    dag: d.dag.slice(5), // MM-DD
    omzet: Number(d.omzet.toFixed(2)),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="omzetGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4f8ef7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="dag" tick={{ fill: '#454b5a', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#454b5a', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
        <Tooltip
          contentStyle={{ background: '#1a1d24', border: '1px solid #252830', borderRadius: 8, fontSize: 12, fontFamily: 'DM Mono' }}
          labelStyle={{ color: '#7a7f8e' }}
          itemStyle={{ color: '#4f8ef7' }}
          formatter={(v: number) => [`€${v.toFixed(2)}`, 'Omzet']}
        />
        <Area type="monotone" dataKey="omzet" stroke="#4f8ef7" strokeWidth={2} fill="url(#omzetGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
