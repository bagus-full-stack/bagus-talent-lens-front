'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockRgpdIndicators } from '@/lib/mock/data/rgpd-governance';

export function RgpdCharts() {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        <div className="h-72 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="h-72 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="h-72 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="h-72 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  const {
    dsrByType,
    processingDelayHistory,
    purgesMonthly,
    retentionBreakdown,
    legalBasisBreakdown,
  } = mockRgpdIndicators;

  return (
    <div className="space-y-6">
      {/* Ligne 1 : DSR par type et Délais de traitement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique 1 : Demandes par type */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Exercice des droits DSR par type (Art. 15-22 RGPD)
              </CardTitle>
              <p className="text-xs text-slate-500">
                Volume cumulé sur les 12 derniers mois (Total : 103 demandes)
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Art. 15 à 21
            </Badge>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dsrByType} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Demandes reçues" radius={[4, 4, 0, 0]}>
                  {dsrByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique 2 : Délais de traitement vs Plafond CNIL */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Délai moyen de réponse DSR (Jours calendaires)
              </CardTitle>
              <p className="text-xs text-slate-500">
                Plafond légal CNIL strict : 30 jours · Objectif interne : &lt; 15 jours
              </p>
            </div>
            <Badge variant="success" className="text-xs">
              Moyenne actuelle : 8.4 j
            </Badge>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={processingDelayHistory}
                margin={{ top: 10, right: 20, left: -20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 35]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="delayDays"
                  name="Délai réel constaté"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="internalGoal"
                  name="Cible interne (< 15j)"
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="legalLimit"
                  name="Plafond CNIL (30j)"
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ligne 2 : Purges passées et prévisionnelles + Échéances de rétention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique 3 : Purges mensuelles passées & prévisions */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Volumes des purges automatiques (Historique & Prévisions)
              </CardTitle>
              <p className="text-xs text-slate-500">
                Destruction certifiée par scellement WORM après 24 mois
              </p>
            </div>
            <Badge variant="warning" className="text-xs">
              +133 CV à purger Q4
            </Badge>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={purgesMonthly}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                <Bar
                  dataKey="past"
                  name="CV purgés (WORM certifié)"
                  fill="#64748b"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="forecast"
                  name="Prévisions de purge (Sans réengagement)"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique 4 : État de rétention du vivier */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Répartition des durées de rétention (1 432 CV actifs)
              </CardTitle>
              <p className="text-xs text-slate-500">
                Santé du vivier face à la règle des 24 mois CNIL
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              90.8% Conformes
            </Badge>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={retentionBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {retentionBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ligne 3 : Taux de couverture de la Base Légale */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">
              Ventilation par Base Légale documentée (Art. 6 RGPD)
            </CardTitle>
            <p className="text-xs text-slate-500">
              Conformité juridique globale : 98.9% des profils disposent d&apos;un fondement valide
            </p>
          </div>
          <Badge variant="success" className="text-xs">
            15 profils à régulariser
          </Badge>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {legalBasisBreakdown.map((item) => (
              <div
                key={item.name}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                    {item.value}
                  </span>
                  <span className="text-xs text-slate-400">
                    {((item.value / 1420) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
