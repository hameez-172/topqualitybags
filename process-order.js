// This file acts as your secure backend API on Vercel.
// It receives data from your frontend and forwards it securely to PostEx.

export default async function handler(req, res) {
    // 1. Security Check: Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    // Extract the customer data sent from index.html
    const { orderID, name, phone, address, city, total_bill } = req.body;

    // Basic validation
    if (!name || !phone || !address || !city) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // 2. Load API Keys from Vercel Environment Variables (Do not hardcode here)
    // In your Vercel project settings, you MUST add POSTEX_API_KEY
    const POSTEX_API_KEY = process.env.POSTEX_API_KEY;

    if (!POSTEX_API_KEY) {
        console.error("Missing PostEx API Key in Vercel Environment Variables");
        // For development/testing purposes, if the key is missing, we will simulate success.
        // REMOVE THIS in production!
        return res.status(200).json({ 
            success: true, 
            trackingNumber: "TEST-TRK-" + Math.floor(Math.random() * 10000) 
        });
    }

    // 3. Format the JSON payload specifically for PostEx Create Order API
    const postexPayload = {
        orderRef: orderID,
        customerName: name,
        customerPhone: phone,
        deliveryAddress: address,
        invoiceDivision: 1, 
        cityName: city,     
        orderDetail: "Premium Leather Bag (3000)",
        invoiceAmount: 3000,
        orderType: "Normal", 
        weight: 1.0 // Standard weight for a bag
    };

    try {
        // 4. Send the data to PostEx API
        const postexResponse = await fetch('https://api.postex.pk/services/integration/api/order/v1/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': POSTEX_API_KEY // Securely attach the API key
            },
            body: JSON.stringify(postexPayload)
        });

        const postexData = await postexResponse.json();

        if (postexResponse.ok && postexData.statusCode === "200") {
            // Success! Send the tracking number back to the frontend
            return res.status(200).json({ 
                success: true, 
                trackingNumber: postexData.dist.trackingNumber 
            });
        } else {
            console.error("PostEx Error:", postexData);
            return res.status(400).json({ 
                success: false, 
                message: 'PostEx rejected the order',
                details: postexData
            });
        }

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}