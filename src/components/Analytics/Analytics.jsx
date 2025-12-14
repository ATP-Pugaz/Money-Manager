import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
    formatCurrency,
    getMonthName,
    getShortMonthName,
    categoryIcons,
    categoryColors,
    getPercentageChange
} from '../../utils/helpers';
import './Analytics.css';

// Pie chart colors
const pieColors = [
    '#00BCD4', '#FF5252', '#00E676', '#7C4DFF', '#FF9800',
    '#E91E63', '#8BC34A', '#03A9F4', '#FFC107', '#9C27B0'
];

// Chevron icons
const ChevronLeft = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15,18 9,12 15,6" />
    </svg>
);

const ChevronRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9,6 15,12 9,18" />
    </svg>
);

export default function Analytics() {
    const {
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        getMonthTransactions,
        getMonthTotals,
        getPreviousMonthTotals,
        getAutoSyncStats,
        transactions,
        goToPreviousMonth,
        goToNextMonth,
        goToCurrentMonth
    } = useApp();

    // State for filtering categories by type
    const [selectedType, setSelectedType] = useState('expense');
    const [showYearPicker, setShowYearPicker] = useState(false);

    const today = new Date();
    const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();

    const monthTransactions = getMonthTransactions();
    const totals = getMonthTotals();
    const prevTotals = getPreviousMonthTotals();
    const syncStats = getAutoSyncStats();

    // Get last 6 months data for chart
    const getMonthlyData = () => {
        const data = [];
        for (let i = 5; i >= 0; i--) {
            let month = selectedMonth - i;
            let year = selectedYear;
            if (month < 0) {
                month += 12;
                year -= 1;
            }

            const monthTrans = transactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === month && d.getFullYear() === year;
            });

            const income = monthTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const expense = monthTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

            data.push({
                month: getShortMonthName(month),
                income,
                expense
            });
        }
        return data;
    };

    // Get category breakdown based on selected type
    const getCategoryBreakdown = () => {
        const breakdown = {};
        monthTransactions
            .filter(t => t.type === selectedType)
            .forEach(t => {
                breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
            });
        return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
    };

    const monthlyData = getMonthlyData();
    const maxValue = Math.max(...monthlyData.flatMap(d => [d.income, d.expense]), 1);
    const categoryBreakdown = getCategoryBreakdown();
    const totalAmount = categoryBreakdown.reduce((sum, [, val]) => sum + val, 0);

    // Calculate pie chart segments
    const getPieSegments = () => {
        let cumulativePercent = 0;
        return categoryBreakdown.map(([category, amount], index) => {
            const percent = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
            const startAngle = cumulativePercent * 3.6; // 3.6 = 360/100
            cumulativePercent += percent;
            const endAngle = cumulativePercent * 3.6;

            return {
                category,
                amount,
                percent,
                color: pieColors[index % pieColors.length],
                startAngle,
                endAngle
            };
        });
    };

    const pieSegments = getPieSegments();

    // Create SVG pie chart path
    const createPieSlice = (startAngle, endAngle, color, index) => {
        const radius = 80;
        const centerX = 100;
        const centerY = 100;

        // Convert angles to radians
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);

        const x1 = centerX + radius * Math.cos(startRad);
        const y1 = centerY + radius * Math.sin(startRad);
        const x2 = centerX + radius * Math.cos(endRad);
        const y2 = centerY + radius * Math.sin(endRad);

        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

        const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');

        return (
            <path
                key={index}
                d={pathData}
                fill={color}
                stroke="var(--primary-bg)"
                strokeWidth="2"
                style={{ transition: 'all 0.3s ease' }}
            />
        );
    };

    // Calculate trends
    const incomeChange = getPercentageChange(totals.income, prevTotals.income);
    const expenseChange = getPercentageChange(totals.expenses, prevTotals.expenses);
    const savingsChange = getPercentageChange(totals.savings, prevTotals.savings);

    // Year options
    const yearOptions = [];
    for (let y = today.getFullYear(); y >= today.getFullYear() - 5; y--) {
        yearOptions.push(y);
    }

    return (
        <div className="analytics-container">
            <h2 className="analytics-title">📊 Analytics</h2>

            {/* Month/Year Selector */}
            <div className="month-selector">
                <button className="month-nav-btn" onClick={goToPreviousMonth}>
                    <ChevronLeft />
                </button>
                <div className="month-display" onClick={() => setShowYearPicker(!showYearPicker)}>
                    <div className="month-name">{getMonthName(selectedMonth)}</div>
                    <div className="month-year clickable">
                        {selectedYear} ▼
                    </div>
                </div>
                <button className="month-nav-btn" onClick={goToNextMonth}>
                    <ChevronRight />
                </button>
                {!isCurrentMonth && (
                    <button className="today-btn" onClick={goToCurrentMonth}>
                        Today
                    </button>
                )}
            </div>

            {/* Year Picker Dropdown */}
            {showYearPicker && (
                <div className="year-picker">
                    {yearOptions.map(year => (
                        <button
                            key={year}
                            className={`year-option ${year === selectedYear ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedYear(year);
                                setShowYearPicker(false);
                            }}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            )}

            {/* Overview Cards - Clickable */}
            <div className="analytics-overview">
                <div
                    className={`overview-card clickable ${selectedType === 'income' ? 'selected' : ''}`}
                    onClick={() => setSelectedType('income')}
                >
                    <div className="overview-value income">{formatCurrency(totals.income)}</div>
                    <div className="overview-label">Total Income</div>
                </div>
                <div
                    className={`overview-card clickable ${selectedType === 'expense' ? 'selected' : ''}`}
                    onClick={() => setSelectedType('expense')}
                >
                    <div className="overview-value expense">{formatCurrency(totals.expenses)}</div>
                    <div className="overview-label">Total Expenses</div>
                </div>
                <div className="overview-card">
                    <div className="overview-value savings">{formatCurrency(totals.savings)}</div>
                    <div className="overview-label">Net Savings</div>
                </div>
                <div className="overview-card">
                    <div className="overview-value count">{monthTransactions.length}</div>
                    <div className="overview-label">Transactions</div>
                </div>
            </div>

            {/* Pie Chart Section */}
            <div className="pie-chart-section">
                <h3 className="chart-title">
                    {selectedType === 'income' ? '💰 Income Breakdown' : '💳 Expense Breakdown'}
                </h3>

                {categoryBreakdown.length > 0 ? (
                    <div className="pie-chart-container">
                        <div className="pie-chart-wrapper">
                            <svg viewBox="0 0 200 200" className="pie-chart-svg">
                                {pieSegments.map((seg, i) =>
                                    createPieSlice(seg.startAngle, seg.endAngle, seg.color, i)
                                )}
                                {/* Center circle for donut effect */}
                                <circle cx="100" cy="100" r="45" fill="var(--card-bg)" />
                                <text x="100" y="95" textAnchor="middle" className="pie-center-text">
                                    {formatCurrency(totalAmount)}
                                </text>
                                <text x="100" y="115" textAnchor="middle" className="pie-center-label">
                                    Total
                                </text>
                            </svg>
                        </div>

                        {/* Pie Legend */}
                        <div className="pie-legend">
                            {pieSegments.map((seg, i) => (
                                <div key={seg.category} className="legend-item">
                                    <span
                                        className="legend-color"
                                        style={{ background: seg.color }}
                                    />
                                    <span className="legend-icon">{categoryIcons[seg.category] || '📦'}</span>
                                    <span className="legend-name">{seg.category}</span>
                                    <span className="legend-amount">{formatCurrency(seg.amount)}</span>
                                    <span className="legend-percent">{seg.percent.toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="no-data-message">
                        <p>No {selectedType} transactions this month</p>
                    </div>
                )}
            </div>

            {/* Monthly Trend Chart */}
            <div className="chart-section">
                <h3 className="chart-title">📈 6-Month Trend</h3>
                <div className="bar-chart">
                    {monthlyData.map((data, i) => (
                        <div key={i} className="bar-group">
                            <div className="bar-container">
                                <div
                                    className="bar income"
                                    style={{ height: `${(data.income / maxValue) * 150}px` }}
                                    title={`Income: ${formatCurrency(data.income)}`}
                                />
                                <div
                                    className="bar expense"
                                    style={{ height: `${(data.expense / maxValue) * 150}px` }}
                                    title={`Expense: ${formatCurrency(data.expense)}`}
                                />
                            </div>
                            <span className="bar-label">{data.month}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ width: '12px', height: '12px', background: 'var(--success)', borderRadius: '2px' }} />
                        Income
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ width: '12px', height: '12px', background: 'var(--danger)', borderRadius: '2px' }} />
                        Expense
                    </span>
                </div>
            </div>

            {/* Trend Cards */}
            <div className="trend-section">
                <h3 className="chart-title">📉 Month-over-Month Trends</h3>

                <div className="trend-card">
                    <div className={`trend-icon ${incomeChange >= 0 ? 'up' : 'down'}`}>
                        {incomeChange >= 0 ? '📈' : '📉'}
                    </div>
                    <div className="trend-content">
                        <div className="trend-title">Income Trend</div>
                        <div className="trend-description">Compared to last month</div>
                    </div>
                    <div className={`trend-value ${incomeChange >= 0 ? 'positive' : 'negative'}`}>
                        {incomeChange >= 0 ? '+' : ''}{incomeChange}%
                    </div>
                </div>

                <div className="trend-card">
                    <div className={`trend-icon ${expenseChange <= 0 ? 'up' : 'down'}`}>
                        {expenseChange <= 0 ? '✅' : '⚠️'}
                    </div>
                    <div className="trend-content">
                        <div className="trend-title">Expense Trend</div>
                        <div className="trend-description">Compared to last month</div>
                    </div>
                    <div className={`trend-value ${expenseChange <= 0 ? 'positive' : 'negative'}`}>
                        {expenseChange >= 0 ? '+' : ''}{expenseChange}%
                    </div>
                </div>

                <div className="trend-card">
                    <div className={`trend-icon ${savingsChange >= 0 ? 'up' : 'down'}`}>
                        {savingsChange >= 0 ? '💰' : '💸'}
                    </div>
                    <div className="trend-content">
                        <div className="trend-title">Savings Trend</div>
                        <div className="trend-description">Compared to last month</div>
                    </div>
                    <div className={`trend-value ${savingsChange >= 0 ? 'positive' : 'negative'}`}>
                        {savingsChange >= 0 ? '+' : ''}{savingsChange}%
                    </div>
                </div>
            </div>

            {/* Source Breakdown */}
            <div className="source-section">
                <h3 className="chart-title">🔄 Transaction Sources</h3>
                <div className="source-grid">
                    <div className="source-card">
                        <div className="source-count">{syncStats.upiCount}</div>
                        <div className="source-label upi">UPI Auto-Sync</div>
                    </div>
                    <div className="source-card">
                        <div className="source-count">{syncStats.smsCount}</div>
                        <div className="source-label sms">Bank SMS</div>
                    </div>
                    <div className="source-card">
                        <div className="source-count">{syncStats.manualCount}</div>
                        <div className="source-label manual">Manual Entry</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
