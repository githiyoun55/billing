// Data Storage
let products = JSON.parse(localStorage.getItem('momasFood_products')) || [];
let bills = JSON.parse(localStorage.getItem('momasFood_bills')) || [];
let currentBill = [];
let productIdCounter = parseInt(localStorage.getItem('momasFood_productIdCounter')) || 1;
let billIdCounter = parseInt(localStorage.getItem('momasFood_billIdCounter')) || 1;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadRecentBills();
    setupTabs();
    populateProductSelect();
    setDefaultMonth();
});

// Tab Navigation
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            if (targetTab === 'reports') {
                generateMonthlyReport();
            }
        });
    });
}

// Product Management
function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No products found. Add your first product!</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>₹ ${product.price.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editProduct(${product.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </td>
        `;
    });
}

function searchProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#productsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const modalTitle = document.getElementById('modalTitle');
    
    form.reset();
    document.getElementById('productId').value = '';
    
    if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
            modalTitle.textContent = 'Edit Product';
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productPrice').value = product.price;
        }
    } else {
        modalTitle.textContent = 'Add Product';
    }
    
    modal.style.display = 'block';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function saveProduct(event) {
    event.preventDefault();
    
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    
    if (id) {
        // Update existing product
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            products[index] = { id: parseInt(id), name, category, price };
        }
    } else {
        // Add new product
        const newProduct = {
            id: productIdCounter++,
            name,
            category,
            price
        };
        products.push(newProduct);
        localStorage.setItem('momasFood_productIdCounter', productIdCounter.toString());
    }
    
    localStorage.setItem('momasFood_products', JSON.stringify(products));
    loadProducts();
    populateProductSelect();
    closeProductModal();
}

function editProduct(id) {
    openProductModal(id);
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('momasFood_products', JSON.stringify(products));
        loadProducts();
        populateProductSelect();
    }
}

function populateProductSelect() {
    const select = document.getElementById('productSelect');
    select.innerHTML = '<option value="">Select Product</option>';
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} - ₹${product.price.toFixed(2)}`;
        select.appendChild(option);
    });
}

// Billing Functions
function addToBill() {
    const select = document.getElementById('productSelect');
    const productId = parseInt(select.value);
    
    if (!productId) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = currentBill.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        currentBill.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    updateBillDisplay();
    select.value = '';
}

function updateBillDisplay() {
    const tbody = document.getElementById('billTableBody');
    tbody.innerHTML = '';
    
    if (currentBill.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No items in bill</td></tr>';
        document.getElementById('grandTotal').textContent = '₹ 0.00';
        return;
    }
    
    let grandTotal = 0;
    
    currentBill.forEach((item, index) => {
        const row = tbody.insertRow();
        const total = item.price * item.quantity;
        grandTotal += total;
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>
                <input type="number" class="quantity-input" value="${item.quantity}" 
                       min="1" onchange="updateQuantity(${index}, this.value)">
            </td>
            <td>₹ ${item.price.toFixed(2)}</td>
            <td>₹ ${total.toFixed(2)}</td>
            <td>
                <button class="btn btn-danger" onclick="removeFromBill(${index})">Remove</button>
            </td>
        `;
    });
    
    document.getElementById('grandTotal').textContent = `₹ ${grandTotal.toFixed(2)}`;
}

function updateQuantity(index, quantity) {
    const qty = parseInt(quantity);
    if (qty > 0) {
        currentBill[index].quantity = qty;
        updateBillDisplay();
    }
}

function removeFromBill(index) {
    currentBill.splice(index, 1);
    updateBillDisplay();
}

function clearBill() {
    if (currentBill.length === 0) return;
    
    if (confirm('Clear all items from the bill?')) {
        currentBill = [];
        updateBillDisplay();
    }
}

function generateBill() {
    if (currentBill.length === 0) {
        alert('Please add items to the bill first!');
        return;
    }
    
    const total = currentBill.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const bill = {
        id: billIdCounter++,
        date: new Date().toISOString(),
        items: currentBill.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: total
    };
    
    bills.push(bill);
    localStorage.setItem('momasFood_bills', JSON.stringify(bills));
    localStorage.setItem('momasFood_billIdCounter', billIdCounter.toString());
    
    showBillModal(bill);
    currentBill = [];
    updateBillDisplay();
    loadRecentBills();
}

function showBillModal(bill) {
    const modal = document.getElementById('billModal');
    const content = document.getElementById('billPrintContent');
    
    const date = new Date(bill.date);
    const formattedDate = date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let itemsHtml = '';
    bill.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        itemsHtml += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹ ${item.price.toFixed(2)}</td>
                <td>₹ ${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    });
    
    content.innerHTML = `
        <div class="print-bill">
            <div class="print-bill-header">
                <h2>Momas Food</h2>
                <p>Fast Food Restaurant</p>
                <p>Bill ID: #${bill.id}</p>
                <p>${formattedDate}</p>
            </div>
            <div class="print-bill-items">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #ddd;">
                            <th style="text-align: left; padding: 10px;">Item</th>
                            <th style="text-align: center; padding: 10px;">Qty</th>
                            <th style="text-align: right; padding: 10px;">Price</th>
                            <th style="text-align: right; padding: 10px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>
            <div class="print-bill-total">
                Grand Total: ₹ ${bill.total.toFixed(2)}
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
                <p>Thank you for visiting Momas Food!</p>
                <p>Visit us again!</p>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeBillModal() {
    document.getElementById('billModal').style.display = 'none';
}

function printBill() {
    const printContent = document.getElementById('billPrintContent').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    
    // Reload page to restore functionality
    location.reload();
}

function loadRecentBills() {
    const container = document.getElementById('recentBills');
    container.innerHTML = '';
    
    const recentBills = bills.slice(-10).reverse();
    
    if (recentBills.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No bills yet</p></div>';
        return;
    }
    
    recentBills.forEach(bill => {
        const billDiv = document.createElement('div');
        billDiv.className = 'bill-item';
        billDiv.onclick = () => showBillModal(bill);
        
        const date = new Date(bill.date);
        const formattedDate = date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        billDiv.innerHTML = `
            <div class="bill-item-header">
                <span>Bill #${bill.id}</span>
                <span>₹ ${bill.total.toFixed(2)}</span>
            </div>
            <div class="bill-item-date">${formattedDate}</div>
            <div style="margin-top: 10px; color: #666;">
                ${bill.items.length} item(s)
            </div>
        `;
        
        container.appendChild(billDiv);
    });
}

// Reports Functions
function setDefaultMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('reportMonth').value = `${year}-${month}`;
}

function generateMonthlyReport() {
    const monthInput = document.getElementById('reportMonth').value;
    if (!monthInput) return;
    
    const [year, month] = monthInput.split('-');
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    
    const monthBills = bills.filter(bill => {
        const billDate = new Date(bill.date);
        return billDate >= monthStart && billDate <= monthEnd;
    });
    
    const totalSales = monthBills.reduce((sum, bill) => sum + bill.total, 0);
    const totalOrders = monthBills.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    document.getElementById('totalSales').textContent = `₹ ${totalSales.toFixed(2)}`;
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('avgOrderValue').textContent = `₹ ${avgOrderValue.toFixed(2)}`;
    
    // Display bill details
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';
    
    if (monthBills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No bills found for this month</td></tr>';
        return;
    }
    
    monthBills.reverse().forEach(bill => {
        const row = tbody.insertRow();
        const date = new Date(bill.date);
        const formattedDate = date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const itemsList = bill.items.map(item => `${item.name} (${item.quantity}x)`).join(', ');
        
        row.innerHTML = `
            <td>#${bill.id}</td>
            <td>${formattedDate}</td>
            <td>${itemsList}</td>
            <td>₹ ${bill.total.toFixed(2)}</td>
        `;
    });
}

// Close modals when clicking outside
window.onclick = function(event) {
    const productModal = document.getElementById('productModal');
    const billModal = document.getElementById('billModal');
    
    if (event.target === productModal) {
        productModal.style.display = 'none';
    }
    if (event.target === billModal) {
        billModal.style.display = 'none';
    }
}
