const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock data for session token and other constants
const SESSION_TOKEN = 'mock_session_token';
const SARAH_ACCOUNT_NO = '1234567890';
const SARAH_ACCOUNT_NAME = 'Sarah';
const BILL_REFERENCE_NO = '123456';

app.post('/signup', async (req, res) => {
    const { OriginatingAccountNo, OriginatingAccountName, OriginatingBankBIC } = req.body;

    // Step 2: Get customer's account balance
    let response = await axios.get('https://api.ocbc.com/account/balance', {
        params: {
            accountNo: OriginatingAccountNo,
            sessionToken: SESSION_TOKEN
        }
    });

    const { ledgerBalance, currencyCode } = response.data;

    // Step 3: Check if currency conversion is needed
    let needConversion = (currencyCode !== 'SGD');

    // Step 4: Get Forex rates if conversion is needed
    let bankBuyingRateTT = 1.0; // Default rate for SGD
    if (needConversion) {
        response = await axios.get('https://api.ocbc.com/forex/rates', {
            params: {
                country: 'SGD' // Assuming conversion to SGD
            }
        });
        bankBuyingRateTT = response.data.bankBuyingRateTT;
    }

    // Step 5: Convert subscription amount if needed
    const subscriptionAmount = 100.0; // Mock subscription amount
    let convertedAmount = subscriptionAmount;
    if (needConversion) {
        convertedAmount *= bankBuyingRateTT;
    }

    // Display GIRO signup details
    res.json({
        ReceivingAccountNo: SARAH_ACCOUNT_NO,
        ReceivingAccountName: SARAH_ACCOUNT_NAME,
        OriginatingAccountNo: OriginatingAccountNo,
        OriginatingAccountName: OriginatingAccountName,
        OriginatingBankBIC: OriginatingBankBIC,
        BillReferenceNo: BILL_REFERENCE_NO,
        ledgerBalance: ledgerBalance,
        subscriptionAmount: subscriptionAmount,
        convertedAmount: convertedAmount
    });
});

app.post('/signup', async (req, res) => {
    const { ReceivingAccountNo, ReceivingAccountName, OriginatingAccountNo, OriginatingAccountName, OriginatingBankBIC, BillReferenceNo } = req.body;

    // Step 2: Sign up for GIRO
    let response = await axios.post('https://api.ocbc.com/giro/signup', {
        ReceivingAccountNo: ReceivingAccountNo,
        ReceivingAccountName: ReceivingAccountName,
        OriginatingAccountNo: OriginatingAccountNo,
        OriginatingAccountName: OriginatingAccountName,
        OriginatingBankBIC: OriginatingBankBIC,
        BillReferenceNo: BillReferenceNo
    });

    const { RecordStatus } = response.data;

    res.json({ RecordStatus });
});

app.post('/enquiry', async (req, res) => {
    const { OriginatingAccountNo, OriginatingBankBIC } = req.body;

    // Step 2: Enquire GIRO transaction details
    let response = await axios.get('https://api.ocbc.com/giro/enquiry', {
        params: {
            ReceivingAccountNo: SARAH_ACCOUNT_NO,
            OriginatingAccountNo: OriginatingAccountNo,
            OriginatingBankBIC: OriginatingBankBIC,
            BillReferenceNo: BILL_REFERENCE_NO
        }
    });

    res.json(response.data);
});

app.listen(3000, () => console.log('Server started on port 3000'));