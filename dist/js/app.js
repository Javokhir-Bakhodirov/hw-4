"use strict";
// Elements
const $overlay = document.querySelector("#overlay");
const $modal = document.querySelector("#modal");
const $incomeBtn = document.querySelector("#incomeBtn");
const $expenseBtn = document.querySelector("#expenseBtn");
const $closeBtn = document.querySelector("#closeBtn");
const $transactionForm = document.querySelector("#transactionForm");
const $alertError = document.querySelector("#alertError");
const $IncomeText = document.querySelector("#incomeText");
const $ExpenseText = document.querySelector("#expenseText");
const $transactionList = document.querySelector("#transactionList");
const $topCategories = document.querySelector("#topCategories");
// Chart.js setup
const ctx = document.getElementById("balanceChart");
const url = new URL(location.href);
const INCOME = JSON.parse(localStorage.getItem("incomes")) || [];
const EXPENSE = JSON.parse(localStorage.getItem("expenses")) || [];
const getCurrentQuery = () => {
    return new URLSearchParams(location.search).get("modal") || "";
};
// @ts-ignore
let balanceChart = new Chart(ctx, {
    type: "bar",
    data: {
        labels: ["Income", "Expense"],
        datasets: [
            {
                label: "Balance Overview",
                data: [0, 0],
                backgroundColor: [
                    "rgba(75, 192, 192, 0.2)",
                    "rgba(255, 99, 132, 0.2)",
                ],
                borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
                borderWidth: 1,
            },
        ],
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    },
});
const updateChart = () => {
    const totalIncome = INCOME.reduce((acc, curr) => (acc += curr.transactionAmount), 0);
    const totalExpense = EXPENSE.reduce((acc, curr) => (acc += curr.transactionAmount), 0);
    balanceChart.data.datasets[0].data = [totalIncome, totalExpense];
    balanceChart.update();
};
const updateTopCategories = () => {
    const categories = {};
    EXPENSE.forEach((expense) => {
        if (expense.transactionType) {
            categories[expense.transactionType] =
                (categories[expense.transactionType] || 0) +
                    expense.transactionAmount;
        }
    });
    // Get total expense to calculate percentages
    const totalExpense = EXPENSE.reduce((acc, curr) => (acc += curr.transactionAmount), 0);
    // Sort categories by amount and take the top 5
    const sortedCategories = Object.entries(categories)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    // Clear the existing top categories list
    $topCategories.innerHTML = "";
    // Render progress bars for the top 5 categories
    sortedCategories.forEach(([category, amount]) => {
        const percentage = ((amount / totalExpense) * 100).toFixed(2);
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <div class="flex justify-between mb-1">
                <span>${category}</span>
                <span>${percentage}%</span>
            </div>
            <progress class="progress progress-accent w-full" value="${percentage}" max="100"></progress>
        `;
        $topCategories.appendChild(listItem);
    });
    // Update the pie chart
    const categoryNames = sortedCategories.map(([category]) => category);
    const categoryAmounts = sortedCategories.map(([, amount]) => amount);
};
const renderTransactionList = () => {
    $transactionList.innerHTML = "";
    const allTransactions = [...INCOME, ...EXPENSE].sort((a, b) => b.date - a.date);
    allTransactions.forEach(transaction => {
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="flex justify-between p-2 bg-gray-700 rounded-lg">
                <span>${transaction.transactionName} (${transaction.type})</span>
                <span>${transaction.transactionAmount} UZS</span>
            </div>
        `;
        $transactionList.appendChild(li);
    });
};
const checkModalOpen = () => {
    let openModal = getCurrentQuery();
    let $select = $transactionForm.querySelector("select");
    if (openModal === "income") {
        $overlay.classList.remove("hidden");
        $select.classList.add("hidden");
    }
    else if (openModal === "expense") {
        $overlay.classList.remove("hidden");
        $select.classList.remove("hidden");
    }
    else {
        $overlay.classList.add("hidden");
    }
};
class Transaction {
    transactionName;
    transactionType;
    transactionAmount;
    type;
    date;
    constructor(transactionName, transactionAmount, transactionType, type) {
        this.transactionName = transactionName;
        this.transactionType = transactionType;
        this.transactionAmount = transactionAmount;
        this.type = type;
        this.date = new Date().getTime();
    }
}
const createNewTransaction = (e) => {
    e.preventDefault();
    let timeOut;
    function showToast() {
        $alertError.classList.remove("hidden");
        timeOut = setTimeout(() => {
            $alertError.classList.add("hidden");
        }, 3000);
    }
    const inputs = Array.from($transactionForm.querySelectorAll("input, select"));
    const values = inputs.map(input => {
        if (input.type === "number") {
            return +input.value;
        }
        return input.value ? input.value : undefined;
    });
    if (values
        .slice(0, getCurrentQuery() === "income" ? -1 : undefined)
        .every(value => typeof value === "string"
        ? value?.trim().length > 0
        : value && value > 0)) {
        const newTransaction = new Transaction(...values, getCurrentQuery());
        if (getCurrentQuery() === "income") {
            INCOME.push(newTransaction);
            localStorage.setItem("incomes", JSON.stringify(INCOME));
        }
        else if (getCurrentQuery() === "expense") {
            EXPENSE.push(newTransaction);
            localStorage.setItem("expenses", JSON.stringify(EXPENSE));
        }
        window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
        checkModalOpen();
        inputs.forEach((input) => (input.value = ""));
        checkBalance();
    }
    else {
        clearTimeout(timeOut);
        showToast();
    }
};
// Function to check and update the balance
const checkBalance = () => {
    const totalIncome = INCOME.reduce((acc, curr) => (acc += curr.transactionAmount), 0);
    const totalExpense = EXPENSE.reduce((acc, curr) => (acc += curr.transactionAmount), 0);
    $IncomeText.innerHTML = `${totalIncome} UZS`;
    $ExpenseText.innerHTML = `${totalExpense} UZS`;
    // Update charts and transaction list
    updateChart();
    updateTopCategories();
    renderTransactionList();
};
checkBalance();
$incomeBtn.addEventListener("click", () => {
    url.searchParams.set("modal", "income");
    window.history.pushState({ path: location.href + "?" + url.searchParams }, "", location.href + "?" + url.searchParams);
    checkModalOpen();
});
$expenseBtn.addEventListener("click", () => {
    url.searchParams.set("modal", "expense");
    window.history.pushState({ path: location.href + "?" + url.searchParams }, "", location.href + "?" + url.searchParams);
    checkModalOpen();
});
$closeBtn.addEventListener("click", () => {
    window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
    checkModalOpen();
});
checkModalOpen();
$transactionForm.addEventListener("submit", createNewTransaction);
