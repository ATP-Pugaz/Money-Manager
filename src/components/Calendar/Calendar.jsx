import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
    formatCurrency,
    getMonthName,
    getDaysInMonth,
    getFirstDayOfMonth,
    formatDate,
    formatTime,
    categoryIcons,
    isToday
} from '../../utils/helpers';
import './Calendar.css';

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

export default function Calendar() {
    const {
        selectedMonth,
        selectedYear,
        selectedDate,
        setSelectedDate,
        goToPreviousMonth,
        goToNextMonth,
        getMonthTransactions,
        getDateTransactions
    } = useApp();

    const [hoveredDay, setHoveredDay] = useState(null);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const monthTransactions = getMonthTransactions();

    // Get day data
    const getDayData = (day) => {
        const date = new Date(selectedYear, selectedMonth, day);
        const transactions = getDateTransactions(date);
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const pending = transactions.filter(t => t.status === 'pending').length;
        return { transactions, income, expense, pending, count: transactions.length };
    };

    // Selected day transactions
    const selectedDayData = selectedDate ? getDayData(selectedDate.getDate()) : null;

    // Stats for the month
    const stats = {
        totalDaysWithTransactions: new Set(
            monthTransactions.map(t => new Date(t.date).getDate())
        ).size,
        highestDay: (() => {
            const dailyTotals = {};
            monthTransactions.filter(t => t.type === 'expense').forEach(t => {
                const day = new Date(t.date).getDate();
                dailyTotals[day] = (dailyTotals[day] || 0) + t.amount;
            });
            const max = Math.max(...Object.values(dailyTotals), 0);
            return max;
        })(),
        avgDaily: monthTransactions.length > 0
            ? Math.round(monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) / daysInMonth)
            : 0
    };

    return (
        <div className="calendar-container">
            <h2 className="calendar-title">📅 Calendar View</h2>

            {/* Full Calendar */}
            <div className="full-calendar">
                <div className="full-calendar-header">
                    <button className="calendar-nav-btn" onClick={goToPreviousMonth}>
                        <ChevronLeft />
                    </button>
                    <span className="calendar-month-title">
                        {getMonthName(selectedMonth)} {selectedYear}
                    </span>
                    <button className="calendar-nav-btn" onClick={goToNextMonth}>
                        <ChevronRight />
                    </button>
                </div>

                <div className="full-calendar-grid">
                    {/* Day names */}
                    {dayNames.map(day => (
                        <div key={day} className="full-calendar-day-name">{day}</div>
                    ))}

                    {/* Empty cells */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="full-calendar-day empty other-month" />
                    ))}

                    {/* Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(selectedYear, selectedMonth, day);
                        const dayData = getDayData(day);
                        const isTodayDate = isToday(date);
                        const isSelected = selectedDate?.getTime() === date.getTime();
                        const isHovered = hoveredDay === day;

                        return (
                            <button
                                key={day}
                                className={`full-calendar-day ${isTodayDate ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                                onClick={() => setSelectedDate(isSelected ? null : date)}
                                onMouseEnter={() => setHoveredDay(day)}
                                onMouseLeave={() => setHoveredDay(null)}
                            >
                                <span className="day-number">{day}</span>

                                {/* Transaction indicators */}
                                {dayData.count > 0 && (
                                    <div className="day-indicators">
                                        {dayData.income > 0 && <span className="day-indicator income" />}
                                        {dayData.expense > 0 && <span className="day-indicator expense" />}
                                        {dayData.pending > 0 && <span className="day-indicator pending" />}
                                    </div>
                                )}

                                {/* Tooltip */}
                                {isHovered && dayData.count > 0 && !isSelected && (
                                    <div className="day-tooltip">
                                        <div>{dayData.count} transaction{dayData.count > 1 ? 's' : ''}</div>
                                        {dayData.income > 0 && (
                                            <div className="tooltip-amount income">+{formatCurrency(dayData.income)}</div>
                                        )}
                                        {dayData.expense > 0 && (
                                            <div className="tooltip-amount expense">-{formatCurrency(dayData.expense)}</div>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="calendar-legend">
                <div className="legend-item">
                    <span className="legend-dot income" />
                    <span>Income</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot expense" />
                    <span>Expense</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot pending" />
                    <span>Pending</span>
                </div>
            </div>

            {/* Selected Day Detail */}
            {selectedDate && selectedDayData && (
                <div className="day-detail-panel">
                    <div className="day-detail-title">
                        <span>{formatDate(selectedDate)}</span>
                        <button className="close-detail-btn" onClick={() => setSelectedDate(null)}>×</button>
                    </div>

                    <div className="day-totals">
                        <div className="day-total-item">
                            <div className="day-total-label">Income</div>
                            <div className="day-total-amount income">{formatCurrency(selectedDayData.income)}</div>
                        </div>
                        <div className="day-total-item">
                            <div className="day-total-label">Expenses</div>
                            <div className="day-total-amount expense">{formatCurrency(selectedDayData.expense)}</div>
                        </div>
                        <div className="day-total-item">
                            <div className="day-total-label">Net</div>
                            <div className="day-total-amount net">
                                {formatCurrency(selectedDayData.income - selectedDayData.expense)}
                            </div>
                        </div>
                    </div>

                    {selectedDayData.transactions.length > 0 ? (
                        <div className="transaction-list">
                            {selectedDayData.transactions.map(t => (
                                <div key={t.id} className="transaction-item">
                                    <span className="transaction-icon">{categoryIcons[t.category] || '📦'}</span>
                                    <div className="transaction-details">
                                        <div className="transaction-name">{t.description}</div>
                                        <div className="transaction-meta">
                                            <span>{formatTime(t.date)}</span>
                                            <span className={`transaction-source ${t.source}`}>{t.source}</span>
                                        </div>
                                    </div>
                                    <span className={`transaction-amount ${t.type}`}>
                                        {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted text-center">No transactions on this day</p>
                    )}
                </div>
            )}

            {/* Monthly Stats */}
            <div className="calendar-stats">
                <div className="calendar-stat-card">
                    <div className="stat-value">{stats.totalDaysWithTransactions}</div>
                    <div className="stat-label">Active Days</div>
                </div>
                <div className="calendar-stat-card">
                    <div className="stat-value">{formatCurrency(stats.highestDay)}</div>
                    <div className="stat-label">Highest Spending Day</div>
                </div>
                <div className="calendar-stat-card">
                    <div className="stat-value">{formatCurrency(stats.avgDaily)}</div>
                    <div className="stat-label">Avg Daily Expense</div>
                </div>
            </div>
        </div>
    );
}
