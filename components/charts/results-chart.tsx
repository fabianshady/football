'use client'

import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface ResultsChartProps {
  wins: number
  draws: number
  losses: number
}

export function ResultsChart({ wins, draws, losses }: ResultsChartProps) {
  const data = {
    labels: ['Victorias', 'Empates', 'Derrotas'],
    datasets: [
      {
        data: [wins, draws, losses],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(250, 204, 21, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(250, 204, 21, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#9ca3af', padding: 20 },
      },
    },
  }

  return (
    <div className="h-[250px]">
      <Doughnut data={data} options={options} />
    </div>
  )
}
