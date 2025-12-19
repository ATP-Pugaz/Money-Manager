import { createContext, useContext, useState, useEffect } from 'react';
import { mockBudgets, defaultSettings, defaultCategories, defaultPaymentModes } from '../data/mockData';

const AppContext = createContext();

export function useApp() {
    return useContext(AppContext);
}

export function AppProvider({ children }) {
    // Current date tracking
    const today = new Date();

    // Selected month/year for viewing
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    // Selected date for day view
    const [selectedDate, setSelectedDate] = useState(null);

    // Active navigation tab
    const [activeTab, setActiveTab] = useState('home');

    // Transactions data - START EMPTY for new users
    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem('mm_transactions');
        return saved ? JSON.parse(saved) : [];
    });

    // Budget data
    const [budgets, setBudgets] = useState(() => {
        const saved = localStorage.getItem('mm_budgets');
        return saved ? JSON.parse(saved) : mockBudgets;
    });

    // Settings
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('mm_settings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    // Custom Categories with subcategories
    const [categories, setCategories] = useState(() => {
        const saved = localStorage.getItem('mm_categories');
        return saved ? JSON.parse(saved) : defaultCategories;
    });

    // Payment Modes
    const [paymentModes, setPaymentModes] = useState(() => {
        const saved = localStorage.getItem('mm_payment_modes');
        return saved ? JSON.parse(saved) : defaultPaymentModes;
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('mm_transactions', JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem('mm_budgets', JSON.stringify(budgets));
    }, [budgets]);

    useEffect(() => {
        localStorage.setItem('mm_settings', JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        localStorage.setItem('mm_categories', JSON.stringify(categories));
    }, [categories]);

    useEffect(() => {
        localStorage.setItem('mm_payment_modes', JSON.stringify(paymentModes));
    }, [paymentModes]);

    // Category CRUD operations
    const addCategory = (category) => {
        const newCategory = {
            id: Date.now().toString(),
            name: category.name,
            icon: category.icon || '📁',
            type: category.type || 'expense', // 'expense' or 'income'
            subcategories: []
        };
        setCategories(prev => [...prev, newCategory]);

        // Also add to budgets if expense type
        if (newCategory.type === 'expense') {
            setBudgets(prev => [...prev, {
                id: newCategory.id,
                category: newCategory.name.toLowerCase().replace(/\s+/g, '_'),
                name: newCategory.name,
                limit: 5000
            }]);
        }
        return newCategory;
    };

    const deleteCategory = (categoryId) => {
        setCategories(prev => prev.filter(c => c.id !== categoryId));
        setBudgets(prev => prev.filter(b => b.id !== categoryId));
    };

    const addSubcategory = (categoryId, subcategory) => {
        setCategories(prev => prev.map(cat => {
            if (cat.id === categoryId) {
                return {
                    ...cat,
                    subcategories: [...(cat.subcategories || []), {
                        id: Date.now().toString(),
                        name: subcategory.name,
                        icon: subcategory.icon || cat.icon
                    }]
                };
            }
            return cat;
        }));
    };

    const deleteSubcategory = (categoryId, subcategoryId) => {
        setCategories(prev => prev.map(cat => {
            if (cat.id === categoryId) {
                return {
                    ...cat,
                    subcategories: (cat.subcategories || []).filter(s => s.id !== subcategoryId)
                };
            }
            return cat;
        }));
    };

    // Payment Mode CRUD operations
    const addPaymentMode = (mode) => {
        const newMode = {
            id: Date.now().toString(),
            name: mode.name,
            icon: mode.icon || '💳',
            description: mode.description || ''
        };
        setPaymentModes(prev => [...prev, newMode]);
        return newMode;
    };

    const deletePaymentMode = (modeId) => {
        setPaymentModes(prev => prev.filter(m => m.id !== modeId));
    };

    // Get transactions for selected month
    const getMonthTransactions = () => {
        return transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        });
    };

    // Get transactions for a specific date
    const getDateTransactions = (date) => {
        const targetDate = new Date(date);
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getDate() === targetDate.getDate() &&
                tDate.getMonth() === targetDate.getMonth() &&
                tDate.getFullYear() === targetDate.getFullYear();
        });
    };

    // Calculate month totals
    const getMonthTotals = () => {
        const monthTransactions = getMonthTransactions();
        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        return { income, expenses, savings: income - expenses };
    };

    // Get previous month totals for comparison
    const getPreviousMonthTotals = () => {
        const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
        const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

        const prevTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
        });

        const income = prevTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expenses = prevTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        return { income, expenses, savings: income - expenses };
    };

    // Calculate category spending for current month
    const getCategorySpending = () => {
        const monthTransactions = getMonthTransactions();
        const spending = {};

        monthTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                spending[t.category] = (spending[t.category] || 0) + t.amount;
            });

        return spending;
    };

    // Add new transaction
    const addTransaction = (transaction) => {
        const newTransaction = {
            ...transaction,
            id: Date.now().toString(),
            date: transaction.date || new Date().toISOString(),
            status: 'confirmed',
            source: 'manual'
        };
        setTransactions(prev => [newTransaction, ...prev]);
        return newTransaction;
    };

    // Delete transaction
    const deleteTransaction = (id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    // Update transaction
    const updateTransaction = (id, updates) => {
        setTransactions(prev =>
            prev.map(t => t.id === id ? { ...t, ...updates } : t)
        );
    };

    // Bulk Import Transactions
    const importTransactions = (newTransactions) => {
        setTransactions(prev => [...newTransactions, ...prev]);
    };

    // Update budget
    const updateBudget = (categoryId, newLimit) => {
        setBudgets(prev =>
            prev.map(b => b.id === categoryId ? { ...b, limit: newLimit } : b)
        );
    };

    // Add budget
    const addBudget = (categoryId, categoryName) => {
        const newBudget = {
            id: categoryId || Date.now().toString(),
            category: categoryName.toLowerCase().replace(/\s+/g, '_'),
            name: categoryName,
            limit: 5000
        };
        setBudgets(prev => [...prev, newBudget]);
        return newBudget;
    };

    // Delete budget
    const deleteBudget = (budgetId) => {
        setBudgets(prev => prev.filter(b => b.id !== budgetId));
    };

    // Navigate months
    const goToPreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonth(prev => prev - 1);
        }
        setSelectedDate(null);
    };

    const goToNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonth(prev => prev + 1);
        }
        setSelectedDate(null);
    };

    const goToCurrentMonth = () => {
        setSelectedMonth(today.getMonth());
        setSelectedYear(today.getFullYear());
        setSelectedDate(null);
    };

    // Get auto-sync stats
    const getAutoSyncStats = () => {
        const monthTransactions = getMonthTransactions();
        const upiCount = monthTransactions.filter(t => t.source === 'upi').length;
        const smsCount = monthTransactions.filter(t => t.source === 'sms').length;
        const manualCount = monthTransactions.filter(t => t.source === 'manual').length;
        const pendingCount = monthTransactions.filter(t => t.status === 'pending').length;

        return { upiCount, smsCount, manualCount, pendingCount, total: monthTransactions.length };
    };

    const value = {
        // State
        selectedMonth,
        selectedYear,
        selectedDate,
        activeTab,
        transactions,
        budgets,
        settings,
        categories,
        paymentModes,

        // Setters
        setSelectedMonth,
        setSelectedYear,
        setSelectedDate,
        setActiveTab,
        setSettings,

        // Computed
        getMonthTransactions,
        getDateTransactions,
        getMonthTotals,
        getPreviousMonthTotals,
        getCategorySpending,
        getAutoSyncStats,

        // Actions
        addTransaction,
        deleteTransaction,
        updateTransaction,
        importTransactions,
        updateBudget,
        goToPreviousMonth,
        goToNextMonth,
        goToCurrentMonth,

        // Category actions
        addCategory,
        deleteCategory,
        addSubcategory,
        deleteSubcategory,

        // Payment mode actions
        addPaymentMode,
        deletePaymentMode,

        // Budget actions
        addBudget,
        deleteBudget,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}
