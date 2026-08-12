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
          'rgba(27, 122, 78, 0.85)',
          'rgba(224, 179, 58, 0.85)',
          'rgba(196, 30, 58, 0.85)',
        ],
        borderColor: [
          'rgba(27, 122, 78, 1)',
          'rgba(224, 179, 58, 1)',
          'rgba(196, 30, 58, 1)',
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
