// payment.js
// Handles payment form submission and API integration
import { createPayment } from './paymentService.js';
import { CartService } from './cartService.js';
import { createAddress, getAddressByUserId, updateAddress } from './addressService.js';
import { createOrder } from './orderService.js';
import EmailService from './emailService.js';

// Example: Attach to a payment button or form submission

// Handles payment submission: fetches cart/order, calls backend, and shows result
export async function handlePaymentSubmission(userId, paymentMethod, orderAddress = null) {
    try {
        // 1. Always create a new address for this order from the form data
        let addressId;
        let address;
        
        if (orderAddress) {
            // Use provided address data (from checkout form)
            address = orderAddress;
        } else {
            // Collect address fields from the current form
            address = {
                street: document.getElementById('checkoutAddress')?.value || '',
                suburb: document.getElementById('checkoutSuburb')?.value || '',
                city: document.getElementById('checkoutCity')?.value || '',
                province: document.getElementById('checkoutProvince')?.value || '',
                country: document.getElementById('checkoutCountry')?.value || '',
                postalCode: document.getElementById('checkoutPostal')?.value || '',
                user: { id: userId }
            };
        }
        
        // Validate address fields
        if (!address.street || !address.city || !address.province || !address.country || !address.postalCode) {
            throw new Error('Please fill in all required address fields');
        }
        
        // Add timestamp to ensure unique address creation for each order
        address.orderTimestamp = new Date().toISOString();
        address.isOrderSpecific = true;
        
        console.log('Preparing order-specific address object:', address);

        // Try to fetch an existing address for this user. If present, update it instead of creating a duplicate.
        let savedAddress = null;
        try {
            const existing = await getAddressByUserId(userId).catch(e => null);
            if (existing && existing.id) {
                console.log('Found existing address for user. Updating address id:', existing.id);
                // Merge existing with new fields, prefer new non-empty values from form
                const merged = Object.assign({}, existing, address);
                // Keep ID for update
                merged.id = existing.id;
                // Mark as order-specific if caller requested
                merged.isOrderSpecific = true;
                merged.orderTimestamp = address.orderTimestamp;
                try {
                    savedAddress = await updateAddress(merged);
                    addressId = savedAddress.id;
                    console.log('Updated existing address id for order:', addressId);
                } catch (updErr) {
                    console.warn('Failed to update existing address, falling back to createAddress:', updErr);
                    // fallback to create
                    savedAddress = await createAddress(address);
                    addressId = savedAddress.id;
                    console.log('Created new address id for order after fallback:', addressId);
                }
            } else {
                // No existing address for user — create a new one
                savedAddress = await createAddress(address);
                addressId = savedAddress.id;
                console.log('Created address with ID:', addressId, 'for order');
            }
        } catch (err) {
            // As a last resort, attempt to create the address (network flakiness may cause get to fail)
            console.warn('Error while checking/updating address, creating new address as fallback:', err);
            const fallback = await createAddress(address);
            savedAddress = fallback;
            addressId = fallback.id;
            console.log('Created address with ID (fallback):', addressId);
        }

        // 2. Get the user's cart (or build order items as needed)
        const cart = await CartService.getCartByUserId(userId);
        if (!cart || !cart.cartId) throw new Error('No cart found');

        // 3. Transform cart items to order items and create the order with the address ID (OrderCreateDto structure)
        const orderItems = cart.cartItems.map(item => ({
            bookId: item.book.bookID,
            quantity: item.quantity,
            orderStatus: "PENDING"
        }));
        
        // Format delivery address string for order
        const deliveryAddressString = `${address.street}, ${address.suburb}, ${address.city}, ${address.province}, ${address.country}, ${address.postalCode}`;
        
        const orderCreateDto = {
            regularUserId: userId,
            shippingAddressId: addressId,
            deliveryAddress: deliveryAddressString, // Add formatted address to order
            orderItems
        };
        console.log('🛒 Creating order with delivery address:', deliveryAddressString);
        console.log('📤 Order DTO being sent:', JSON.stringify(orderCreateDto, null, 2));
        
        let savedOrder;
        try {
            savedOrder = await createOrder(orderCreateDto);
            console.log('✅ Order created successfully:', savedOrder.orderId);
            console.log('📋 Saved order contains:', JSON.stringify(savedOrder, null, 2));
        } catch (orderErr) {
            console.error('Order creation failed:', orderErr);
            if (window.showToast) window.showToast('Order creation failed: ' + orderErr.message, 'danger');
            throw orderErr;
        }

        // 4. Create the payment (using orderId)
        let payment;
        try {
            payment = await createPayment({
                userId,
                orderId: savedOrder.orderId,
                paymentMethod
            });
        } catch (payErr) {
            console.error('Payment creation failed:', payErr);
            if (window.showToast) window.showToast('Payment creation failed: ' + payErr.message, 'danger');
            // Optionally attempt to cancel the order or notify server - left as improvement
            throw payErr;
        }

        // 5. Clear the cart on successful payment so UI reflects purchase
        try {
            if (cart && cart.cartId) {
                await CartService.clearCart(cart.cartId);
                console.log('Cleared cart after payment:', cart.cartId);
            }
        } catch (clearErr) {
            console.warn('Failed to clear cart after payment:', clearErr);
        }

        // 6. Notify front-end pages that inventory changed so they can refresh UI
        try {
            const bookIds = orderItems.map(i => i.bookId);
            window.dispatchEvent(new CustomEvent('inventoryUpdated', { detail: { bookIds } }));
            console.log('Dispatched inventoryUpdated event for books:', bookIds);
        } catch (evtErr) {
            console.warn('Failed to dispatch inventoryUpdated event:', evtErr);
        }

        // 7. Also perform an immediate client-side availability decrement so UI updates instantly
        try {
            for (const oi of orderItems) {
                try {
                    const bookResp = await fetch(`http://localhost:8081/api/book/read/${oi.bookId}`);
                    if (!bookResp.ok) continue;
                    const book = await bookResp.json();
                    // Dispatch a client-side event with the book info and quantity sold
                    window.dispatchEvent(new CustomEvent('inventoryUpdatedClient', { detail: { book, quantitySold: oi.quantity } }));
                } catch (innerErr) {
                    console.warn('Failed to fetch book for client-side decrement:', innerErr);
                }
            }
        } catch (clientErr) {
            console.warn('Failed client-side inventory decrement process:', clientErr);
        }

    // 7. Store the current order's delivery address for invoice generation
        const orderAddressData = {
            orderId: savedOrder.orderId,
            deliveryAddress: deliveryAddressString,
            timestamp: new Date().toISOString()
        };
        
        console.log('💾 About to store address data:', orderAddressData);
        
        // Store in both sessionStorage and localStorage for persistence
        sessionStorage.setItem('currentOrderAddress', JSON.stringify(orderAddressData));
        localStorage.setItem(`orderAddress_${savedOrder.orderId}`, JSON.stringify(orderAddressData));
        
        console.log('✅ Successfully stored address for order', savedOrder.orderId);
        console.log('📱 Session storage check:', sessionStorage.getItem('currentOrderAddress'));
        console.log('💿 Local storage check:', localStorage.getItem(`orderAddress_${savedOrder.orderId}`));

        // Auto-send invoice email removed per configuration - invoices are available in orders page.
        // Notify user of success
        try {
            window.showToast && window.showToast('🎉 Payment successful! Your invoice is available in the orders page.', 'success');
        } catch (notifyErr) {
            // If toast helper fails, fall back to alert
            // Success message now shown as toast above; no alert fallback needed.
        }
        
        // Optionally redirect to confirmation page
        // window.location.href = 'confirmation.html';
        return payment;
    } catch (error) {
        if (window.showToast) window.showToast('Payment failed: ' + error.message, 'danger'); else alert('Payment failed: ' + error.message);
        throw error;
    }
}

// Wire up to payment form submission
document.addEventListener('DOMContentLoaded', () => {
    // Load checkout data if available
    const checkoutData = JSON.parse(sessionStorage.getItem('checkoutData') || '{}');
    
    // Display checkout info if available
    if (checkoutData.name) {
        console.log('Loaded checkout data:', checkoutData);
    }
    
    // Handle form submission
    const paymentForm = document.getElementById('dummyPaymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userId = localStorage.getItem('booklifyUserId');
            if (!userId) {
                alert('Please log in to complete your purchase');
                window.location.href = 'login.html';
                return;
            }
            
            const paymentType = document.getElementById('paymentType').value;
            const paymentMethod = paymentType === 'card' ? 'CARD' : 'EFT';
            
            // Get address from checkout data
            const orderAddress = checkoutData.address;
            
            if (!orderAddress) {
                alert('Address information is missing. Please go back to checkout.');
                window.location.href = 'checkout.html';
                return;
            }
            
            try {
                console.log('🚀 Starting payment submission process...');
                console.log('👤 User ID:', userId);
                console.log('💳 Payment method:', paymentMethod);
                console.log('📍 Order address:', orderAddress);
                
                const processBtn = document.querySelector('#dummyPaymentForm button[type="submit"]');
                if (processBtn) {
                    processBtn.disabled = true;
                    processBtn.textContent = 'Processing...';
                }
                
                console.log('📞 Calling handlePaymentSubmission...');
                await handlePaymentSubmission(userId, paymentMethod, orderAddress);
                console.log('✅ Payment submission completed successfully');
                
                // Clear checkout data after successful payment
                sessionStorage.removeItem('checkoutData');
                console.log('🧹 Cleared checkout data from session storage');
                
                // Redirect to orders page
                setTimeout(() => {
                    window.location.href = 'orders.html';
                }, 2000);
                
            } catch (error) {
                console.error('Payment failed:', error);
                const processBtn = document.querySelector('#dummyPaymentForm button[type="submit"]');
                if (processBtn) {
                    processBtn.disabled = false;
                    processBtn.textContent = 'Process Payment';
                }
            }
        });
    }
});
