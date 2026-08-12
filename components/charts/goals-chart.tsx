'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface GoalsChartProps {
  data: { name: string; goals: number; dorsal: number }[]
}

export function GoalsChart({ data }: GoalsChartProps) {
  const chartData = {
    labels: data.map((p) => `#${p.dorsal} ${p.name.split(' ')[0]}`),
    datasets: [
      {
        label: 'Goles',
        data: data.map((p) => p.goals),
        backgroundColor: 'rgba(224, 179, 58, 0.85)',
        borderColor: 'rgba(196, 149, 32, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#9ca3af' },
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
      <Bar data={chartData} options={options} />
    </div>
  )
}
