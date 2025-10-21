/**
 * Invoice Service for Booklify
 * Handles invoice generation, PDF creation, and invoice management
 */

class InvoiceService {
    
    /**
     * Generate invoice data from order information
     * @param {Object} order - Order object with order details
     * @param {Array} orderItems - Array of order items
     * @param {Object} user - User information
     * @returns {Object} Invoice data object
     */
    static async generateInvoiceData(order, orderItems, user, userAddress = null) {
        // Generate unique invoice number
        const invoiceNumber = `INV-${order.orderId}-${Date.now()}`;
        const currentDate = new Date();
        
    // Calculate totals
    // Prices stored in orderItems are VAT-INCLUSIVE. We need to extract the VAT portion
    // so the invoice shows a subtotal (net) and the VAT amount separately while keeping
    // the displayed unit prices inclusive.
    const taxRate = 0.15; // 15% VAT (adjust as needed)
    // Sum the line totals (unit price * qty) as the gross total (VAT included)
    const grossTotal = orderItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    // Extract VAT portion from gross total: VAT = grossTotal * (taxRate / (1 + taxRate))
    const taxAmount = grossTotal * (taxRate / (1 + taxRate));
    // Subtotal (net) is gross minus the VAT portion
    const subtotal = grossTotal - taxAmount;
    // Total amount payable remains the gross total (what customer actually paid)
    const totalAmount = grossTotal;
        
        // Format address from address object or fallback to order delivery address
        let customerAddress = 'No address provided';
        
        console.log('Order object for address extraction:', order);
        console.log('Order deliveryAddress field:', order.deliveryAddress);
        console.log('UserAddress parameter:', userAddress);
        
        // Check for current order address in session storage (from recent payment)
        let sessionOrderAddress = null;
        try {
            const storedAddressData = sessionStorage.getItem('currentOrderAddress');
            console.log('Raw session storage data:', storedAddressData);
            if (storedAddressData) {
                const addressData = JSON.parse(storedAddressData);
                console.log('Parsed session address data:', addressData);
                console.log('Comparing order IDs:', addressData.orderId, 'vs', order.orderId, '(types:', typeof addressData.orderId, typeof order.orderId, ')');
                
                if (addressData.orderId == order.orderId) { // Use == instead of === for type-flexible comparison
                    sessionOrderAddress = addressData.deliveryAddress;
                    console.log('✅ Found matching session address for order:', sessionOrderAddress);
                } else {
                    console.log('❌ Session address is for different order. Session:', addressData.orderId, 'Current:', order.orderId);
                }
            } else {
                console.log('❌ No session address data found');
            }
        } catch (e) {
            console.warn('Could not parse session address data:', e);
        }

        // Also check localStorage for persistent order address storage
        if (!sessionOrderAddress) {
            try {
                const orderAddressKey = `orderAddress_${order.orderId}`;
                const storedOrderAddress = localStorage.getItem(orderAddressKey);
                console.log('Checking localStorage with key:', orderAddressKey, 'Result:', storedOrderAddress);
                
                if (storedOrderAddress) {
                    const addressData = JSON.parse(storedOrderAddress);
                    sessionOrderAddress = addressData.deliveryAddress;
                    console.log('✅ Found order address in localStorage:', sessionOrderAddress);
                }
            } catch (e) {
                console.warn('Could not parse localStorage address data:', e);
            }
        }

        // Last resort: Check if we're still in checkout flow and can get current form data
        if (!sessionOrderAddress) {
            try {
                const checkoutData = sessionStorage.getItem('checkoutData');
                if (checkoutData) {
                    const data = JSON.parse(checkoutData);
                    if (data.address) {
                        const addr = data.address;
                        sessionOrderAddress = `${addr.street || ''}, ${addr.suburb || ''}, ${addr.city || ''}, ${addr.province || ''}, ${addr.country || ''}, ${addr.postalCode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
                        console.log('✅ Found address in current checkout session:', sessionOrderAddress);
                    }
                }
            } catch (e) {
                console.warn('Could not parse checkout data:', e);
            }
        }
        
        if (sessionOrderAddress) {
            console.log('✅ Using fresh stored address (highest priority):', sessionOrderAddress);
            customerAddress = sessionOrderAddress;
        } else if (userAddress) {
            console.log('Formatting address from userAddress:', userAddress);
            customerAddress = `${userAddress.streetAddress || ''}, ${userAddress.city || ''}, ${userAddress.province || ''}, ${userAddress.postalCode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
            console.log('Formatted customer address:', customerAddress);
        } else if (order.deliveryAddress) {
            console.log('Using order delivery address:', order.deliveryAddress);
            customerAddress = order.deliveryAddress;
        } else if (order.shippingAddress) {
            console.log('Using order shippingAddress:', order.shippingAddress);
            const addr = order.shippingAddress;
            customerAddress = `${addr.street || ''}, ${addr.suburb || ''}, ${addr.city || ''}, ${addr.province || ''}, ${addr.country || ''}, ${addr.postalCode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
            console.log('Formatted shipping address:', customerAddress);
        } else {
            console.log('No address found in order object, checking for address ID...');
            // Try to fetch address by shippingAddressId if available
            if (order.shippingAddressId) {
                console.log('Found shippingAddressId:', order.shippingAddressId, '- attempting to fetch address');
                try {
                    const addressResponse = await fetch(`http://localhost:8081/api/addresses/${order.shippingAddressId}`);
                    if (addressResponse.ok) {
                        const addressData = await addressResponse.json();
                        console.log('Fetched address data:', addressData);
                        customerAddress = `${addressData.street || ''}, ${addressData.suburb || ''}, ${addressData.city || ''}, ${addressData.province || ''}, ${addressData.country || ''}, ${addressData.postalCode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
                        console.log('Formatted address from fetched data:', customerAddress);
                    } else {
                        console.error('Failed to fetch address by ID');
                        customerAddress = 'Address not available';
                    }
                } catch (error) {
                    console.error('Error fetching address:', error);
                    customerAddress = 'Address fetch failed';
                }
            } else {
                console.log('No address information found, using fallback');
            }
        }
        
        return {
            invoice: {
                number: invoiceNumber,
                date: currentDate.toLocaleDateString(),
                dueDate: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 30 days from now
                status: order.orderStatus || 'Completed'
            },
            company: {
                name: 'Booklify',
                address: 'Cape Town, South Africa',
                email: 'support@booklify.com',
                phone: '+27 (0) 21 XXX XXXX',
                website: 'www.booklify.com',
                logo: '../assets/images/logo.png'
            },
            customer: {
                name: user?.fullName || user?.name || 'Customer',
                email: user?.email || '',
                address: customerAddress,
                customerId: user?.id || user?.userId || order.userId || 'N/A'
            },
            order: {
                id: order.orderId,
                date: new Date(order.orderDate).toLocaleDateString(),
                paymentMethod: order.paymentMethod || 'Card Payment',
                orderStatus: order.orderStatus || 'Processing'
            },
            items: orderItems.map(item => ({
                description: item.book?.title || item.bookTitle || 'Book',
                author: item.book?.author || item.bookAuthor || '',
                isbn: item.book?.isbn || item.bookIsbn || '',
                condition: item.book?.bookCondition || 'Used',
                quantity: item.quantity || 1,
                unitPrice: item.price || 0,
                total: (item.quantity || 1) * (item.price || 0)
            })),
            totals: {
                // Subtotal is the VAT-excluded net amount
                subtotal: subtotal,
                taxRate: taxRate,
                taxAmount: taxAmount,
                // totalAmount is the gross amount (VAT included) — matches what customer paid
                totalAmount: totalAmount,
                currency: 'R'
            },
            notes: 'Thank you for your business with Booklify! All books are carefully inspected before delivery.',
            terms: 'Payment is due within 30 days. Late payments may incur additional charges.'
        };
    }

    /**
     * Generate HTML invoice template
     * @param {Object} invoiceData - Invoice data object
     * @returns {string} HTML string for the invoice
     */
    static generateInvoiceHTML(invoiceData) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceData.invoice.number} - Booklify</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .invoice-header {
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .invoice-header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: bold;
        }
        
        .invoice-header .tagline {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1rem;
        }
        
        .invoice-body {
            padding: 30px;
        }
        
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .company-details, .customer-details {
            padding: 20px;
            border-radius: 8px;
        }
        
        .company-details {
            background-color: #f8fafc;
            border-left: 4px solid #8b5cf6;
        }
        
        .customer-details {
            background-color: #fef7ff;
            border-left: 4px solid #a855f7;
        }
        
        .section-title {
            font-weight: bold;
            font-size: 1.1rem;
            margin-bottom: 10px;
            color: #4c1d95;
        }
        
        .invoice-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
            padding: 20px;
            background-color: #f1f5f9;
            border-radius: 8px;
        }
        
        .meta-item {
            text-align: center;
        }
        
        .meta-label {
            font-weight: bold;
            color: #64748b;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .meta-value {
            font-size: 1.1rem;
            font-weight: bold;
            color: #1e293b;
            margin-top: 5px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .items-table th {
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        
        .items-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .items-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        
        .items-table tr:hover {
            background-color: #f1f5f9;
        }
        
        .book-title {
            font-weight: bold;
            color: #1e293b;
        }
        
        .book-author {
            color: #64748b;
            font-size: 0.9rem;
        }
        
        .condition-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .condition-excellent { background-color: #dcfce7; color: #166534; }
        .condition-good { background-color: #dbeafe; color: #1d4ed8; }
        .condition-fair { background-color: #fef3c7; color: #92400e; }
        .condition-poor { background-color: #fee2e2; color: #dc2626; }
        
        .totals-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-table {
            width: 300px;
            border-collapse: collapse;
        }
        
        .totals-table td {
            padding: 8px 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .totals-table .label {
            text-align: right;
            font-weight: 500;
        }
        
        .totals-table .amount {
            text-align: right;
            font-weight: bold;
        }
        
        .total-row {
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            color: white;
        }
        
        .total-row td {
            border: none;
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .footer-notes {
            margin-top: 40px;
            padding: 20px;
            background-color: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #8b5cf6;
        }
        
        .footer-notes h4 {
            margin: 0 0 10px 0;
            color: #4c1d95;
        }
        
        .footer-notes p {
            margin: 5px 0;
            color: #64748b;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-completed { background-color: #dcfce7; color: #166534; }
        .status-processing { background-color: #dbeafe; color: #1d4ed8; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-cancelled { background-color: #fee2e2; color: #dc2626; }
        
        @media print {
            body { background-color: white; padding: 0; }
            .invoice-container { box-shadow: none; margin: 0; }
            .no-print { display: none !important; }
        }
        
        @media (max-width: 768px) {
            .invoice-details {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .invoice-meta {
                grid-template-columns: 1fr;
            }
            
            .items-table {
                font-size: 0.9rem;
            }
            
            .totals-section {
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
            <h1>📚 Booklify</h1>
            <p class="tagline">Your Trusted Online Bookstore</p>
        </div>
        
        <!-- Body -->
        <div class="invoice-body">
            <!-- Invoice Details -->
            <div class="invoice-details">
                <div class="company-details">
                    <div class="section-title">From:</div>
                    <strong>${invoiceData.company.name}</strong><br>
                    ${invoiceData.company.address}<br>
                    ${invoiceData.company.email}<br>
                    ${invoiceData.company.phone}<br>
                    ${invoiceData.company.website}
                </div>
                
                <div class="customer-details">
                    <div class="section-title">Bill To:</div>
                    <strong>${invoiceData.customer.name}</strong><br>
                    Customer ID: #${invoiceData.customer.customerId}<br>
                    ${invoiceData.customer.email}<br>
                    ${invoiceData.customer.address}
                </div>
            </div>
            
            <!-- Invoice Meta Information -->
            <div class="invoice-meta">
                <div class="meta-item">
                    <div class="meta-label">Invoice Number</div>
                    <div class="meta-value">${invoiceData.invoice.number}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Invoice Date</div>
                    <div class="meta-value">${invoiceData.invoice.date}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Order ID</div>
                    <div class="meta-value">#${invoiceData.order.id}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Status</div>
                    <div class="meta-value">
                        <span class="status-badge status-${invoiceData.invoice.status.toLowerCase()}">${invoiceData.invoice.status}</span>
                    </div>
                </div>
            </div>
            
            <!-- Items Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Book Details</th>
                        <th>Condition</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceData.items.map(item => {
                        // Compute net (VAT-excluded) unit price and line total for display
                        const taxRate = invoiceData.totals.taxRate || 0;
                        const grossUnit = Number(item.unitPrice || 0);
                        const qty = Number(item.quantity || 1);
                        const netUnit = grossUnit / (1 + taxRate);
                        const netLineTotal = netUnit * qty;

                        return `
                        <tr>
                            <td>
                                <div class="book-title">${item.description}</div>
                                <div class="book-author">by ${item.author}</div>
                                ${item.isbn ? `<div class="book-author">ISBN: ${item.isbn}</div>` : ''}
                            </td>
                            <td>
                                <span class="condition-badge condition-${item.condition.toLowerCase()}">${item.condition}</span>
                            </td>
                            <td>${qty}</td>
                            <td>${invoiceData.totals.currency}${netUnit.toFixed(2)}</td>
                            <td>${invoiceData.totals.currency}${netLineTotal.toFixed(2)}</td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
            
            <!-- Totals -->
            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td class="label">Subtotal:</td>
                        <td class="amount">${invoiceData.totals.currency}${invoiceData.totals.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="label">VAT (${(invoiceData.totals.taxRate * 100).toFixed(0)}%):</td>
                        <td class="amount">${invoiceData.totals.currency}${invoiceData.totals.taxAmount.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td class="label">Total Amount:</td>
                        <td class="amount">${invoiceData.totals.currency}${invoiceData.totals.totalAmount.toFixed(2)}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Footer Notes -->
            <div class="footer-notes">
                <h4>📝 Notes & Terms</h4>
                <p><strong>Notes:</strong> ${invoiceData.notes}</p>
                <p><strong>Terms:</strong> ${invoiceData.terms}</p>
                <p><strong>Payment Method:</strong> ${invoiceData.order.paymentMethod}</p>
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Generate invoice data only (for email purposes)
     * @param {number} orderId - Order ID to generate invoice for
     * @param {Object} user - User information
     * @returns {Promise<Object>} Invoice data object
     */
    static async generateInvoiceDataOnly(orderId, user) {
        try {
            // Fetch order details
            const order = await this.fetchOrderById(orderId);
            const orderItems = await this.fetchOrderItemsByOrderId(orderId);
            
            if (!order || !orderItems) {
                throw new Error('Order not found or no items in order');
            }
            
            // Fetch user address
            let userAddress = null;
            try {
                const userId = localStorage.getItem('booklifyUserId');
                console.log('Fetching address for userId:', userId);
                if (userId) {
                    userAddress = await this.fetchUserAddress(userId);
                    console.log('Fetched user address:', userAddress);
                }
            } catch (addressError) {
                console.warn('Could not fetch user address:', addressError);
            }
            
            // Generate invoice data
            return await this.generateInvoiceData(order, orderItems, user, userAddress);
            
        } catch (error) {
            console.error('Error generating invoice data:', error);
            throw error;
        }
    }

    /**
     * Generate and display invoice in a new window
     * @param {number} orderId - Order ID to generate invoice for
     * @param {Object} user - User information
     */
    static async generateAndDisplayInvoice(orderId, user) {
        try {
            // Fetch order details
            const order = await this.fetchOrderById(orderId);
            const orderItems = await this.fetchOrderItemsByOrderId(orderId);
            
            if (!order || !orderItems) {
                throw new Error('Order not found or no items in order');
            }
            
            // Generate invoice data using order delivery address only
            console.log('Using order delivery address from order data');
            const invoiceData = await this.generateInvoiceData(order, orderItems, user, null);
            
            // Generate HTML
            const invoiceHTML = this.generateInvoiceHTML(invoiceData);
            
            // Open in new window
            const invoiceWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
            invoiceWindow.document.write(invoiceHTML);
            invoiceWindow.document.close();
            
            // Add print and download buttons
            this.addInvoiceActions(invoiceWindow, invoiceData);
            
            return invoiceData;
            
        } catch (error) {
            console.error('Error generating invoice:', error);
            this.showToast('error', 'Failed to generate invoice: ' + error.message);
            throw error;
        }
    }

    /**
     * Add print and download actions to invoice window
     * @param {Window} invoiceWindow - Invoice window reference
     * @param {Object} invoiceData - Invoice data for PDF generation
     */
    static addInvoiceActions(invoiceWindow, invoiceData) {
        const actionsHTML = `
            <div class="no-print" style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
                <button onclick="window.print()" style="margin-right: 10px; padding: 10px 15px; background: #8b5cf6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🖨️ Print Invoice
                </button>
                <button onclick="downloadPDF()" style="padding: 10px 15px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    📄 Download PDF
                </button>
            </div>
        `;
        
        invoiceWindow.document.body.insertAdjacentHTML('beforeend', actionsHTML);
        
        // Add download function to window
        invoiceWindow.downloadPDF = () => {
            this.generatePDF(invoiceData, invoiceWindow);
        };
    }

    /**
     * Generate PDF version of invoice (requires jsPDF library)
     * @param {Object} invoiceData - Invoice data
     * @param {Window} windowRef - Window reference for PDF generation
     */
    static async generatePDF(invoiceData, windowRef = window) {
        try {
            // Prefer to render the styled HTML to PDF using html2canvas + jsPDF
            try {
                // Load html2canvas if needed
                if (typeof windowRef.html2canvas === 'undefined') {
                    await this.loadHtml2Canvas(windowRef);
                }

                // Load jsPDF if needed
                if (typeof windowRef.jspdf === 'undefined') {
                    await this.loadJsPDF(windowRef);
                }

                const { jsPDF } = windowRef.jspdf;

                // Find the invoice container element in the invoice window
                const element = windowRef.document.querySelector('.invoice-container') || windowRef.document.body;

                // Use a higher scale for better quality
                const canvas = await windowRef.html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
                const imgData = canvas.toDataURL('image/png');

                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                let heightLeft = pdfHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();

                while (heightLeft > 0) {
                    position = heightLeft - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pdf.internal.pageSize.getHeight();
                }

                pdf.save(`${invoiceData.invoice.number}.pdf`);
                return;
            } catch (renderErr) {
                console.warn('html2canvas/jsPDF rendering failed, falling back to simple jsPDF text method:', renderErr);
                // fallback to simple text rendering below
            }

            // ----- Fallback simple jsPDF text method -----
            if (typeof windowRef.jspdf === 'undefined') {
                await this.loadJsPDF(windowRef);
            }
            const { jsPDF } = windowRef.jspdf;
            const doc = new jsPDF();

            // Set font
            doc.setFont('helvetica');

            // Header
            doc.setFontSize(20);
            doc.setTextColor(139, 92, 246);
            doc.text('📚 Booklify Invoice', 20, 30);

            // Invoice details
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Invoice Number: ${invoiceData.invoice.number}`, 20, 50);
            doc.text(`Date: ${invoiceData.invoice.date}`, 20, 60);
            doc.text(`Order ID: #${invoiceData.order.id}`, 20, 70);

            // Customer details
            doc.text('Bill To:', 120, 50);
            doc.text(invoiceData.customer.name, 120, 60);
            doc.text(invoiceData.customer.email, 120, 70);

            // Items table (simplified for PDF)
            let yPos = 100;
            doc.text('Items:', 20, yPos);
            yPos += 10;

            invoiceData.items.forEach(item => {
                doc.text(`${item.description} - ${invoiceData.totals.currency}${item.total.toFixed(2)}`, 25, yPos);
                yPos += 10;
            });

            // Totals
            yPos += 10;
            doc.text(`Subtotal: ${invoiceData.totals.currency}${invoiceData.totals.subtotal.toFixed(2)}`, 120, yPos);
            yPos += 10;
            doc.text(`VAT: ${invoiceData.totals.currency}${invoiceData.totals.taxAmount.toFixed(2)}`, 120, yPos);
            yPos += 10;
            doc.setFontSize(14);
            doc.text(`Total: ${invoiceData.totals.currency}${invoiceData.totals.totalAmount.toFixed(2)}`, 120, yPos);

            // Save PDF
            doc.save(`${invoiceData.invoice.number}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            if (window.showToast) window.showToast('PDF generation is not available. Please use the print function instead.', 'warning'); else alert('PDF generation is not available. Please use the print function instead.');
        }
    }

    /**
     * Load jsPDF library dynamically
     * @param {Window} windowRef - Window reference
     */
    static async loadJsPDF(windowRef) {
        return new Promise((resolve, reject) => {
            const script = windowRef.document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            windowRef.document.head.appendChild(script);
        });
    }

    /**
     * Load html2canvas dynamically into the given windowRef
     * @param {Window} windowRef
     */
    static async loadHtml2Canvas(windowRef) {
        return new Promise((resolve, reject) => {
            if (typeof windowRef.html2canvas !== 'undefined') return resolve();
            const script = windowRef.document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => {
                // expose as html2canvas on windowRef
                if (typeof windowRef.html2canvas === 'undefined' && typeof windowRef.html2canvas !== 'function' && windowRef.html2canvas === undefined) {
                    // some CDNs attach to window.html2canvas; ensure reference
                }
                resolve();
            };
            script.onerror = reject;
            windowRef.document.head.appendChild(script);
        });
    }

    /**
     * Fetch order by ID
     * @param {number} orderId - Order ID
     * @returns {Promise<Object>} Order object
     */
    static async fetchOrderById(orderId) {
        // First try to get all orders for the current user
        const userId = localStorage.getItem('booklifyUserId');
        const ordersResponse = await fetch(`http://localhost:8081/api/orders/getByUserId/${userId}`);
        
        if (!ordersResponse.ok) throw new Error('Failed to fetch user orders');
        
        const orders = await ordersResponse.json();
        const order = orders.find(o => o.orderId === parseInt(orderId));
        
        if (!order) throw new Error('Order not found');
        return order;
    }

    /**
     * Fetch order items by order ID
     * @param {number} orderId - Order ID
     * @returns {Promise<Array>} Array of order items
     */
    static async fetchOrderItemsByOrderId(orderId) {
        // Use the same endpoint as ordersPage.js without authentication
        const response = await fetch(`http://localhost:8081/api/orderItems/getByOrderId/${orderId}`);
        
        if (!response.ok) throw new Error('Failed to fetch order items');
        return await response.json();
    }



    /**
     * Show toast notification
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {string} message - Toast message
     */
    static showToast(type, message) {
        // Use existing toast system if available, otherwise use alert
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            if (window.showToast) window.showToast(message, 'info'); else alert(message);
        }
    }

    /**
     * Debug function to check address data for an order
     * Usage in console: InvoiceService.debugOrderAddress(43)
     */
    static async debugOrderAddress(orderId) {
        console.group(`🔍 Address Debug for Order ${orderId}`);
        
        try {
            // Check order data
            const order = await this.fetchOrderById(orderId);
            console.log('📋 Order object:', order);
            console.log('📍 Order deliveryAddress field:', order.deliveryAddress);
            console.log('🏠 Order shippingAddress:', order.shippingAddress);
            console.log('🆔 Order shippingAddressId:', order.shippingAddressId);

            // Check session storage
            const sessionData = sessionStorage.getItem('currentOrderAddress');
            console.log('💾 Session storage data:', sessionData);

            // Check localStorage
            const localData = localStorage.getItem(`orderAddress_${orderId}`);
            console.log('💿 Local storage data:', localData);

            // Show what would be used
            const userData = JSON.parse(localStorage.getItem('booklifyUserData') || '{}');
            const invoiceData = await this.generateInvoiceData(order, [], userData, null);
            console.log('📄 Final address that would be used:', invoiceData.customer.address);
            
        } catch (error) {
            console.error('❌ Error debugging address:', error);
        }
        
        console.groupEnd();
    }
}

// Make debug function available globally
window.debugOrderAddress = InvoiceService.debugOrderAddress.bind(InvoiceService);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InvoiceService;
}