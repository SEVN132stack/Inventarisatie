'use client'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

interface Props {
  verkopenPerDag: { dag: string; omzet: number }[]
  verkopenPerCategorie: { categorie: string; omzet: number; marge: number }[]
  verkopenPerMethode: { methode: string; aantal: number }[]
}

const KLEUREN = ['#4f8ef7','#34d399','#fbbf24','#a78bfa','#f87171','#38bdf8']

export default function DashboardCharts({ verkopenPerDag, verkopenPerCategorie, verkopenPerMethode }: Props) {
  const tooltip = { contentStyle: { background: '#1a1d24', border: '1px solid #252830', borderRadius: 8, fontSize: 11, fontFamily: 'DM Mono' }, labelStyle: { color: '#7a7f8e' } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Omzet per dag */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Omzet afgelopen 14 dagen</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={verkopenPerDag}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="dag" tick={{ fill: '#454b5a', fontSize: 10 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: '#454b5a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`}/>
            <Tooltip {...tooltip} formatter={(v: number) => [`€${v.toFixed(2)}`, 'Omzet']}/>
            <Area type="monotone" dataKey="omzet" stroke="#4f8ef7" strokeWidth={2} fill="url(#g1)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Omzet + marge per categorie */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Per categorie</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={verkopenPerCategorie} layout="vertical">
              <XAxis type="number" tick={{ fill: '#454b5a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`}/>
              <YAxis type="category" dataKey="categorie" tick={{ fill: '#7a7f8e', fontSize: 10 }} axisLine={false} tickLine={false} width={72}/>
              <Tooltip {...tooltip} formatter={(v: number, n: string) => [`€${v.toFixed(2)}`, n]}/>
              <Bar dataKey="omzet" fill="#4f8ef7" radius={[0,4,4,0]} name="Omzet"/>
              <Bar dataKey="marge" fill="#34d399" radius={[0,4,4,0]} name="Marge"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Betaalmethode verdeling */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Betaalmethode</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={verkopenPerMethode} dataKey="aantal" nameKey="methode" cx="50%" cy="50%" outerRadius={55} label={({ methode, percent }) => `${methode} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {verkopenPerMethode.map((_, i) => <Cell key={i} fill={KLEUREN[i % KLEUREN.length]}/>)}
              </Pie>
              <Tooltip {...tooltip} formatter={(v: number) => [v, 'Verkopen']}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
