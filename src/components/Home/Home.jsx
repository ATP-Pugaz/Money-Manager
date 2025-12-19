import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import TransactionModal from '../Modals/TransactionModal';
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
        categories
    } = useApp();

    const [expandedDay, setExpandedDay] = useState(null);
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDate, setModalDate] = useState(new Date().toISOString());

    const monthTransactions = getMonthTransactions();
    const totals = getMonthTotals();

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

    const openAddModal = (day = null) => {
        if (day) {
            // Set date to the selected day at current time or noon
            const date = new Date(selectedYear, selectedMonth, day, 12, 0, 0);
            setModalDate(date.toISOString());
        } else {
            // Default to today
            setModalDate(new Date().toISOString());
        }
        setIsModalOpen(true);
    };

    // Generate days array - only show up to today for current month
    const maxDay = isCurrentMonth ? today.getDate() : daysInMonth;
    // Filter days: show if it has transactions OR if it's today
    const daysArray = Array.from({ length: maxDay }, (_, i) => maxDay - i).filter(day => {
        const { count } = getDayData(day);
        const date = new Date(selectedYear, selectedMonth, day);
        return count > 0 || isToday(date);
    });

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
                    <div className="summary-amount">
                        {totals.savings < 0 ? '-' : ''}{formatCurrency(Math.abs(totals.savings))}
                    </div>
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
                                    {isTodayDate && (
                                        <button
                                            className="quick-add-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openAddModal(day);
                                            }}
                                            title="Add transaction"
                                        >
                                            <PlusIcon />
                                        </button>
                                    )}
                                </div>

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
                        <p className="empty-sub">Tap the + button to add your first transaction</p>
                        <button className="fab-button empty-fab" onClick={() => openAddModal()}>
                            <PlusIcon />
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Action Button (FAB) */}
            <button className="fab-button" onClick={() => openAddModal()}>
                <PlusIcon />
            </button>

            {/* Transaction Modal */}
            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={{ date: modalDate }}
            />
        </div>
    );
}
