
const STORAGE_KEY = 'expenseTrackerTransactions';

/* ---------- DOM References ---------- */
const balanceEl  = document.getElementById('balance');
const incomeEl   = document.getElementById('income');
const expenseEl  = document.getElementById('expense');
const form       = document.querySelector('.transaction-form');
const nameInput  = document.getElementById('transactionName');
const amountInput = document.getElementById('amount');
const typeInput  = document.getElementById('type');
const listEl     = document.getElementById('transactionList');

let transactions = [];

/* ============================================================
   HELPERS
   ============================================================ */

function formatMoney(amount) {
  return 'Rs. ' + Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================================
   PERSISTENCE
   ============================================================ */

function loadTransactions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      transactions = JSON.parse(stored);
    } else {
      // Seed with sample data matching the original static HTML
      const now = new Date().toISOString();
      transactions = [
        { id: 1, name: 'Salary',    amount: 60000, type: 'income',  date: now },
        { id: 2, name: 'Groceries', amount: 7000,  type: 'expense', date: now }
      ];
      saveTransactions();
    }
  } catch (e) {
    transactions = [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

/* ============================================================
   TOTALS
   ============================================================ */

function getTotals() {
  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') income += Number(t.amount);
    else                     expense += Number(t.amount);
  });

  return { income, expense, balance: income - expense };
}

/** Update the three summary cards with a bump animation */
function updateSummary(animate = true) {
  const { income, expense, balance } = getTotals();

  const setValue = (el, value) => {
    const formatted = formatMoney(value);
    if (el.textContent === formatted) return;

    el.textContent = formatted;

    if (animate) {
      el.classList.remove('bump');
      // force reflow so the animation can restart
      void el.offsetWidth;
      el.classList.add('bump');
    }
  };

  setValue(balanceEl, balance);
  setValue(incomeEl, income);
  setValue(expenseEl, expense);
}

/* ============================================================
   RENDER TRANSACTION LIST
   ============================================================ */

function renderTransactions() {
  listEl.innerHTML = '';

  // Empty state
  if (transactions.length === 0) {
    listEl.innerHTML = `
      <li class="empty-state">
        <i class="fas fa-receipt"></i>
        No transactions yet. Add one above!
      </li>`;
    return;
  }

  // Newest first
  const sorted = [...transactions].reverse();

  sorted.forEach((t, index) => {
    const li = document.createElement('li');
    li.className = `transaction-item ${t.type}`;
    li.dataset.id = t.id;
    li.style.animationDelay = `${index * 0.05}s`;

    // Icon: money in (income) → arrow down, money out (expense) → arrow up
    const iconClass = t.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up';
    const sign      = t.type === 'income' ? '+' : '−';

    // Date
    const date    = t.date ? new Date(t.date) : new Date();
    const dateStr = date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    li.innerHTML = `
      <div class="t-icon"><i class="fas ${iconClass}"></i></div>
      <div class="t-details">
        <h4>${escapeHtml(t.name)}</h4>
        <span>${dateStr}</span>
      </div>
      <div class="t-amount">${sign} ${formatMoney(t.amount)}</div>
      <button class="delete-btn" data-id="${t.id}" title="Delete">
        <i class="fas fa-trash"></i>
      </button>
    `;

    listEl.appendChild(li);
  });
}

/* ============================================================
   ADD TRANSACTION
   ============================================================ */

function addTransaction(e) {
  e.preventDefault();

  const name   = nameInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type   = typeInput.value;

  // Validation
  if (!name || isNaN(amount) || amount <= 0) {
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 400);
    return;
  }

  const newTransaction = {
    id: Date.now(),
    name,
    amount,
    type,
    date: new Date().toISOString()
  };

  transactions.push(newTransaction);
  saveTransactions();

  renderTransactions();
  updateSummary();

  form.reset();
  nameInput.focus();
  listEl.scrollTop = 0;
}

/* ============================================================
   DELETE TRANSACTION (with slide-out animation)
   ============================================================ */

function deleteTransaction(id) {
  const item = listEl.querySelector(`.transaction-item[data-id="${id}"]`);

  const finalizeDelete = () => {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    renderTransactions();
    updateSummary();
  };

  if (item) {
    item.classList.add('removing');
    item.addEventListener('animationend', finalizeDelete, { once: true });
  } else {
    finalizeDelete();
  }
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */

form.addEventListener('submit', addTransaction);

// Event delegation for delete buttons
listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  deleteTransaction(id);
});

/* ============================================================
   INIT
   ============================================================ */

function init() {
  loadTransactions();
  renderTransactions();
  updateSummary(false); 

init();