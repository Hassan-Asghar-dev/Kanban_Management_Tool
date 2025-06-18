import React, { useContext, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { DashboardContext } from './WorkDayTracker'; // Adjust path as needed

function BurndownChart() {
  const { tasks } = useContext(DashboardContext);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    // Clean up previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Find sprint start and finish dates from tasks
    const sprintDates = tasks.reduce(
      (acc, task) => {
        if (!task.sprint_start || !task.sprint_finish) return acc;
        const start = new Date(task.sprint_start);
        const finish = new Date(task.sprint_finish);
        return {
          start: acc.start ? (start < acc.start ? start : acc.start) : start,
          finish: acc.finish ? (finish > acc.finish ? finish : acc.finish) : finish,
        };
      },
      { start: null, finish: null }
    );

    if (!sprintDates.start || !sprintDates.finish) {
      console.warn('No valid sprint dates found in tasks');
      return;
    }

    // Calculate sprint duration in days
    const sprintStart = sprintDates.start;
    const sprintFinish = sprintDates.finish;
    const sprintDurationMs = sprintFinish - sprintStart;
    const sprintDurationDays = Math.ceil(sprintDurationMs / (1000 * 60 * 60 * 24));

    if (sprintDurationDays <= 0) {
      console.warn('Invalid sprint duration');
      return;
    }

    // Calculate total initial work (sum of remaining progress at sprint start)
    const totalInitialWork = tasks.reduce((sum, task) => {
      const progress = task.progress !== undefined ? task.progress : 0;
      return sum + (100 - progress);
    }, 0);

    // Generate labels (days of sprint)
    const labels = Array.from({ length: sprintDurationDays }, (_, i) => {
      const date = new Date(sprintStart);
      date.setDate(date.getDate() + i);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Ideal burndown: Linear decrease from totalInitialWork to 0
    const idealBurndown = Array.from({ length: sprintDurationDays }, (_, i) => {
      return totalInitialWork * (1 - i / (sprintDurationDays - 1));
    });

    // Actual burndown: For simplicity, assume progress updates are linear
    // In a real app, you'd fetch historical progress data or use a backend API
    const currentDate = new Date();
    const daysSinceStart = Math.floor((currentDate - sprintStart) / (1000 * 60 * 60 * 24));
    const actualBurndown = Array.from({ length: sprintDurationDays }, (_, i) => {
      if (i > daysSinceStart) return null; // Future days have no data
      // Linearly interpolate progress based on current day
      const progressFraction = i / daysSinceStart;
      const interpolatedWork = tasks.reduce((sum, task) => {
        const progress = task.progress !== undefined ? task.progress : 0;
        const initialWork = 100 - progress;
        const remainingWork = i === daysSinceStart ? initialWork : initialWork * (1 - progressFraction);
        return sum + Math.max(0, remainingWork);
      }, 0);
      return interpolatedWork;
    });

    // Create the chart
    const ctx = chartRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ideal Burndown',
            data: idealBurndown,
            borderColor: 'rgba(0, 128, 0, 0.5)',
            backgroundColor: 'rgba(0, 128, 0, 0.1)',
            fill: false,
            tension: 0.1,
          },
          {
            label: 'Actual Burndown',
            data: actualBurndown,
            borderColor: 'rgba(255, 99, 132, 0.5)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            fill: false,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Sprint Burndown Chart',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Remaining Work (Story Points)',
            },
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [tasks]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl mx-auto mt-6">
      <canvas ref={chartRef} />
    </div>
  );
}

export default BurndownChart;