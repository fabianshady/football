'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface MonthlyGoalsChartProps {
  data: { month: string; scored: number; conceded: number }[]
}

export function MonthlyGoalsChart({ data }: MonthlyGoalsChartProps) {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Goles a favor',
        data: data.map((d) => d.scored),
        borderColor: 'rgba(224, 179, 58, 1)',
        backgroundColor: 'rgba(224, 179, 58, 0.12)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Goles en contra',
        data: data.map((d) => d.conceded),
        borderColor: 'rgba(196, 30, 58, 1)',
        backgroundColor: 'rgba(196, 30, 58, 0.12)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#9ca3af' },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: { display: false },
      },
    },
  }

  return (
    <div className="h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  )
}
