import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
    getGreeting,
    formatCurrency,
    getMonthName,
    getDaysInMonth,
    formatDate,
    formatTime,
    categoryIcons,
    getPercentageChange,
    isToday
} from '../../utils/helpers';
import './Home.css';

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

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

export default function Home() {
    const {
        selectedMonth,
        selectedYear,
        goToPreviousMonth,
        goToNextMonth,
        goToCurrentMonth,
        getMonthTransactions,
        getDateTransactions,
        getMonthTotals,
        getCategorySpending,
        budgets,
        setActiveTab,
        addTransaction,
        categories
    } = useApp();

    const [expandedDay, setExpandedDay] = useState(null);
    const [showQuickAdd, setShowQuickAdd] = useState(null);
    const [quickAddData, setQuickAddData] = useState({ type: 'expense', amount: '', description: '', category: 'food' });

    // Get filtered categories based on selected type
    const filteredCategories = categories?.filter(c => c.type === quickAddData.type) || [];

    const monthTransactions = getMonthTransactions();
    const totals = getMonthTotals();
    const categorySpending = getCategorySpending();

    const today = new Date();
    const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

    // Get day names
    const getDayName = (day) => {
        const date = new Date(selectedYear, selectedMonth, day);
        return date.toLocaleDateString('en-IN', { weekday: 'short' });
    };

    // Get transactions for each day
    const getDayData = (day) => {
        const date = new Date(selectedYear, selectedMonth, day);
        const dayTransactions = getDateTransactions(date);
        const income = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        return { transactions: dayTransactions, income, expense, count: dayTransactions.length };
    };

    // Handle quick add
    const handleQuickAdd = (day) => {
        if (!quickAddData.amount || !quickAddData.description) return;

        const date = new Date(selectedYear, selectedMonth, day, 12, 0, 0);
        addTransaction({
            type: quickAddData.type,
            amount: parseFloat(quickAddData.amount),
            description: quickAddData.description,
            category: quickAddData.category,
            date: date.toISOString()
        });

        setQuickAddData({ type: 'expense', amount: '', description: '', category: 'other' });
        setShowQuickAdd(null);
    };

    // Generate days array - only show up to today for current month
    const maxDay = isCurrentMonth ? today.getDate() : daysInMonth;
    const daysArray = Array.from({ length: maxDay }, (_, i) => maxDay - i);

    return (
        <div className="home-container">
            {/* Header with Greeting */}
            <div className="home-header">
                <div className="greeting-section">
                    <h1 className="greeting-text">{getGreeting()}! 👋</h1>
                    <p className="greeting-sub">Track your daily transactions</p>
                </div>

                {/* Month Selector */}
                <div className="month-selector">
                    <button className="month-nav-btn" onClick={goToPreviousMonth}>
                        <ChevronLeft />
                    </button>
                    <div className="month-display">
                        <div className="month-name">{getMonthName(selectedMonth)}</div>
                        <div className="month-year">{selectedYear}</div>
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
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="summary-card income">
                    <div className="summary-label">Income</div>
                    <div className="summary-amount">{formatCurrency(totals.income)}</div>
                </div>
                <div className="summary-card expense">
                    <div className="summary-label">Expenses</div>
                    <div className="summary-amount">{formatCurrency(totals.expenses)}</div>
                </div>
                <div className="summary-card savings">
                    <div className="summary-label">Balance</div>
                    <div className="summary-amount">{formatCurrency(totals.savings)}</div>
                </div>
            </div>

            {/* Vertical Calendar with Transactions */}
            <div className="vertical-calendar">
                <div className="calendar-list-header">
                    <h3>📅 Daily Transactions</h3>
                    <span className="text-muted">{monthTransactions.length} total</span>
                </div>

                <div className="calendar-vertical-list">
                    {daysArray.map(day => {
                        const date = new Date(selectedYear, selectedMonth, day);
                        const dayData = getDayData(day);
                        const isTodayDate = isToday(date);
                        const isExpanded = expandedDay === day;
                        const hasTransactions = dayData.count > 0;

                        return (
                            <div
                                key={day}
                                className={`vertical-day-card ${isTodayDate ? 'today' : ''} ${isExpanded ? 'expanded' : ''} ${hasTransactions ? 'has-transactions' : ''}`}
                            >
                                {/* Day Header */}
                                <div
                                    className="day-header"
                                    onClick={() => setExpandedDay(isExpanded ? null : day)}
                                >
                                    <div className="day-info">
                                        <span className="day-number">{day}</span>
                                        <div className="day-details">
                                            <span className="day-name">{getDayName(day)}</span>
                                            {isTodayDate && <span className="today-badge">Today</span>}
                                        </div>
                                    </div>
                                    <div className="day-summary">
                                        {dayData.income > 0 && (
                                            <span className="day-income">+{formatCurrency(dayData.income)}</span>
                                        )}
                                        {dayData.expense > 0 && (
                                            <span className="day-expense">-{formatCurrency(dayData.expense)}</span>
                                        )}
                                        {dayData.count === 0 && (
                                            <span className="no-transactions">No transactions</span>
                                        )}
                                    </div>
                                    <button
                                        className="quick-add-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowQuickAdd(showQuickAdd === day ? null : day);
                                            setExpandedDay(day);
                                        }}
                                        title="Add transaction"
                                    >
                                        <PlusIcon />
                                    </button>
                                </div>

                                {/* Quick Add Form */}
                                {showQuickAdd === day && (
                                    <div className="quick-add-form">
                                        <div className="quick-add-row">
                                            <select
                                                value={quickAddData.type}
                                                onChange={(e) => setQuickAddData({ ...quickAddData, type: e.target.value })}
                                                className="quick-add-select"
                                            >
                                                <option value="expense">Expense</option>
                                                <option value="income">Income</option>
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="₹ Amount"
                                                value={quickAddData.amount}
                                                onChange={(e) => setQuickAddData({ ...quickAddData, amount: e.target.value })}
                                                className="quick-add-input"
                                            />
                                        </div>
                                        <div className="quick-add-row">
                                            <input
                                                type="text"
                                                placeholder="Description"
                                                value={quickAddData.description}
                                                onChange={(e) => setQuickAddData({ ...quickAddData, description: e.target.value })}
                                                className="quick-add-input flex-1"
                                            />
                                            <select
                                                value={quickAddData.category}
                                                onChange={(e) => setQuickAddData({ ...quickAddData, category: e.target.value })}
                                                className="quick-add-select"
                                            >
                                                {filteredCategories.map(cat => (
                                                    <option key={cat.id} value={cat.name.toLowerCase().replace(/\s+/g, '_')}>
                                                        {cat.icon} {cat.name}
                                                    </option>
                                                ))}
                                                {filteredCategories.length === 0 && (
                                                    <option value="other">📦 Other</option>
                                                )}
                                            </select>
                                        </div>
                                        <div className="quick-add-actions">
                                            <button
                                                className="quick-add-cancel"
                                                onClick={() => setShowQuickAdd(null)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="quick-add-save"
                                                onClick={() => handleQuickAdd(day)}
                                                disabled={!quickAddData.amount || !quickAddData.description}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Transactions List */}
                                {isExpanded && dayData.count > 0 && (
                                    <div className="day-transactions">
                                        {dayData.transactions.map(t => (
                                            <div key={t.id} className="transaction-row">
                                                <span className="tx-icon">{categoryIcons[t.category] || '📦'}</span>
                                                <div className="tx-info">
                                                    <span className="tx-desc">{t.description}</span>
                                                    <span className="tx-category">{t.category}</span>
                                                </div>
                                                <span className={`tx-amount ${t.type}`}>
                                                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {monthTransactions.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <p className="empty-text">No transactions this month</p>
                        <p className="empty-sub">Tap the + button on any day to add your first transaction</p>
                    </div>
                )}
            </div>
        </div>
    );
}
