import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SMSParser } from '../../utils/smsParser';

export default function TransactionModal({ isOpen, onClose, editingTransaction = null, initialData = {} }) {
    const {
        addTransaction,
        updateTransaction,
        categories,
        paymentModes,
        transactions
    } = useApp();

    const [newTx, setNewTx] = useState({
        type: 'expense',
        amount: '',
        category: 'food',
        subcategory: '',
        description: '',
        paymentMode: 'cash',
        source: 'manual',
        date: new Date().toISOString().split('T')[0],
        referenceId: ''
    });

    // Reset or Fill form when modal opens or editing changes
    useEffect(() => {
        if (isOpen) {
            if (editingTransaction) {
                const date = new Date(editingTransaction.date);
                setNewTx({
                    type: editingTransaction.type,
                    amount: editingTransaction.amount.toString(),
                    category: editingTransaction.category,
                    subcategory: editingTransaction.subcategory || '',
                    description: editingTransaction.description,
                    paymentMode: editingTransaction.paymentMode || 'cash',
                    source: editingTransaction.source || 'manual',
                    date: date.toISOString().split('T')[0],
                    referenceId: editingTransaction.referenceId || ''
                });
            } else {
                // Initialize with defaults or provided initial data (like date)
                setNewTx({
                    type: 'expense',
                    amount: '',
                    category: 'food',
                    subcategory: '',
                    description: '',
                    paymentMode: 'cash',
                    source: 'manual',
                    date: initialData.date || new Date().toISOString().split('T')[0],
                    referenceId: ''
                });
            }
        }
    }, [isOpen, editingTransaction, initialData]);

    const resetForm = () => {
        setNewTx({
            type: 'expense',
            amount: '',
            category: 'food',
            subcategory: '',
            description: '',
            paymentMode: 'cash',
            source: 'manual',
            date: new Date().toISOString().split('T')[0],
            referenceId: ''
        });
    };

    const handleTypeChange = (type) => {
        const newCategories = categories?.filter(c => c.type === type) || [];
        const firstCategory = newCategories[0]?.name.toLowerCase().replace(/\s+/g, '_') || 'other';
        const firstCatObj = newCategories[0];
        const firstSub = firstCatObj?.subcategories?.[0]?.name || '';

        setNewTx({
            ...newTx,
            type,
            category: firstCategory,
            subcategory: firstSub
        });
    };

    const handleCategoryChange = (val) => {
        const catObj = categories?.find(c => c.name.toLowerCase().replace(/\s+/g, '_') === val);
        const firstSub = catObj?.subcategories?.[0]?.name || '';
        setNewTx({ ...newTx, category: val, subcategory: firstSub });
    };

    const checkDuplicate = (minTx) => {
        const newHash = SMSParser.generateHash(minTx);
        return transactions.some(t => {
            const existingHash = SMSParser.generateHash(t);
            return existingHash === newHash;
        });
    };

    const handlePasteSMS = async () => {
        try {
            let text = '';
            try {
                text = await navigator.clipboard.readText();
            } catch (permErr) {
                // Clipboard permission denied or not supported
                text = prompt('Paste your SMS here:');
            }

            if (!text) {
                alert('No text found!');
                return;
            }

            const parsed = SMSParser.parse(text);
            if (parsed) {
                // Check for duplicates
                const isDuplicate = checkDuplicate(parsed);

                if (isDuplicate) {
                    const proceed = confirm('⚠️ Duplicate Transaction Detected!\nA similar transaction already exists. Do you want to add it anyway?');
                    if (!proceed) return;
                }

                setNewTx({
                    ...newTx,
                    type: parsed.type,
                    amount: parsed.amount.toString(),
                    description: parsed.description,
                    paymentMode: parsed.paymentMode,
                    date: parsed.date.split('T')[0],
                    source: 'sms_parser',
                    referenceId: parsed.referenceId || ''
                });
                alert('✅ SMS parsed successfully!');
            } else {
                alert('❌ Could not detect a valid transaction in the text.');
            }
        } catch (err) {
            console.error(err);
            alert('Error parsing SMS.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newTx.amount || !newTx.description) return;

        const now = new Date();
        const selectedDate = new Date(newTx.date);
        selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        const txData = {
            ...newTx,
            amount: parseFloat(newTx.amount),
            date: selectedDate.toISOString()
        };

        if (editingTransaction) {
            updateTransaction(editingTransaction.id, txData);
        } else {
            addTransaction(txData);
        }

        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    // Derived state for rendering
    const filteredCategories = categories?.filter(c => c.type === newTx.type) || [];
    const currentCategory = categories?.find(c => c.name.toLowerCase().replace(/\s+/g, '_') === newTx.category);
    const subcategories = currentCategory?.subcategories || [];

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h3 className="modal-title">
                            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                        </h3>
                        {!editingTransaction && (
                            <button
                                type="button"
                                onClick={handlePasteSMS}
                                style={{
                                    fontSize: '0.8rem',
                                    padding: '4px 8px',
                                    background: 'rgba(0, 230, 118, 0.1)',
                                    color: 'var(--success)',
                                    border: '1px solid rgba(0, 230, 118, 0.3)',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                                title="Paste bank SMS to auto-fill"
                            >
                                ✨ Paste SMS
                            </button>
                        )}
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form className="modal-body" onSubmit={handleSubmit}>
                    {/* Type Toggle */}
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <div className="type-toggle">
                            <button
                                type="button"
                                className={`type-btn expense ${newTx.type === 'expense' ? 'active' : ''}`}
                                onClick={() => handleTypeChange('expense')}
                            >
                                Expense
                            </button>
                            <button
                                type="button"
                                className={`type-btn income ${newTx.type === 'income' ? 'active' : ''}`}
                                onClick={() => handleTypeChange('income')}
                            >
                                Income
                            </button>
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={newTx.date}
                            onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                            required
                        />
                    </div>

                    {/* Amount */}
                    <div className="form-group">
                        <label className="form-label">Amount (₹)</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="Enter amount"
                            value={newTx.amount}
                            onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="What was this for?"
                            value={newTx.description}
                            onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                            required
                        />
                    </div>

                    {/* Category - Filtered by type */}
                    <div className="form-group">
                        <label className="form-label">
                            Category ({newTx.type === 'income' ? '💰 Income' : '💳 Expense'})
                        </label>
                        <select
                            className="form-input"
                            value={newTx.category}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                        >
                            {filteredCategories.map(cat => (
                                <option key={cat.id} value={cat.name.toLowerCase().replace(/\s+/g, '_')}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                            <option value="other">📦 Other</option>
                        </select>
                    </div>

                    {/* Subcategory Dropdown */}
                    {subcategories.length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Subcategory</label>
                            <select
                                className="form-input"
                                value={newTx.subcategory}
                                onChange={(e) => setNewTx({ ...newTx, subcategory: e.target.value })}
                            >
                                <option value="">Select Subcategory</option>
                                {subcategories.map(sub => (
                                    <option key={sub.id} value={sub.name}>
                                        {sub.icon} {sub.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Payment Mode */}
                    <div className="form-group">
                        <label className="form-label">Payment Mode</label>
                        <select
                            className="form-input"
                            value={newTx.paymentMode}
                            onChange={(e) => setNewTx({ ...newTx, paymentMode: e.target.value })}
                        >
                            <option value="cash">💵 Cash</option>
                            <option value="upi">📱 UPI</option>
                            <option value="card">💳 Card</option>
                            <option value="netbanking">🏦 Net Banking</option>
                            {paymentModes?.map(mode => (
                                <option key={mode.id} value={mode.name.toLowerCase()}>
                                    {mode.icon} {mode.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Hidden Reference ID field (for SMS parsed data) */}
                    <input type="hidden" value={newTx.referenceId} />

                    <button type="submit" className="submit-btn" style={{ marginTop: '10px' }}>
                        {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                    </button>
                </form>
            </div>
        </div>
    );
}
