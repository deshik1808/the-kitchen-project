const fs = require('fs');
const crypto = require('crypto');
const token = require('D:/UserFiles/Downloads/the-kitchen-project-bc8d581ef629.json');

function base64urlEncode(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAuthToken() {
  const header = { alg: 'RS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const payload = {
    iss: token.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: token.token_uri,
    exp,
    iat
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signatureInput = encodedHeader + '.' + encodedPayload;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = base64urlEncode(sign.sign(token.private_key));

  const jwt = signatureInput + '.' + signature;

  const res = await fetch(token.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt
  });
  const data = await res.json();
  return data.access_token;
}

async function addDummyItems() {
  try {
    const accessToken = await getAuthToken();
    const spreadsheetId = '1Hrn3MbWGud0yUPblTt0EjHD_9BBD-0R1IYFuZ6GB9nw';

    const categories = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Fast Food'];
    const dishNames = [
      'Paneer Tikka', 'Chicken 65', 'Veg Spring Rolls', 'Crispy Corn', 'Chicken Wings',
      'Butter Chicken', 'Paneer Butter Masala', 'Dal Makhani', 'Veg Biryani', 'Chicken Biryani',
      'Mutton Rogan Josh', 'Masala Dosa', 'Chole Bhature', 'Veg Manchurian', 'Hakka Noodles',
      'Gulab Jamun', 'Rasmalai', 'Chocolate Lava Cake', 'Vanilla Ice Cream', 'Brownie',
      'Masala Chai', 'Mango Lassi', 'Cold Coffee', 'Fresh Lime Soda', 'Iced Tea',
      'Cheese Burger', 'Veg Pizza', 'Chicken Sandwich', 'French Fries', 'Garlic Bread'
    ];

    const dummyItems = [];
    for (let i = 0; i < 30; i++) {
        const dish = dishNames[i] || `Dummy Dish ${i + 1}`;
        const category = categories[Math.floor(Math.random() * categories.length)];
        const price = Math.floor(Math.random() * 401) + 99; // 99 to 499
        const isVeg = Math.random() > 0.4 ? 'Veg' : 'Non-Veg';
        const id = i + 101; 
        const sortOrder = i + 1;
        
        dummyItems.push([
          id,                                      // A: ID
          dish,                                    // B: Name
          `Delicious ${dish} made with fresh ingredients.`, // C: Description
          price,                                   // D: Price
          category,                                // E: Category
          'https://res.cloudinary.com/dgv3ycgxb/image/upload/v1774665125/Biryani_Logo_HD_page-0004_lrs3mp.jpg', // F: Image URL
          'Y',                                     // G: Available
          'Extra Cheese: 30, Extra Spicy: 0',      // H: Add-ons
          sortOrder,                               // I: Sort Order
          isVeg                                    // J: Veg/Non-Veg
        ]);
    }

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Menu!A2:J:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: dummyItems })
    });

    const data = await res.json();
    if (data.updates && data.updates.updatedRows) {
      console.log(`Successfully added ${data.updates.updatedRows} dummy items to the Menu sheet.`);
    } else {
      console.error("Error adding dummy items:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error adding dummy items:", err.message);
  }
}

addDummyItems();
