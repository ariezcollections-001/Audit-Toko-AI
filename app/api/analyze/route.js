import {
  smartMapHeaders,
  calculateAnalysis,
  parseExcelFile,
  parseHppFile,
  generateMassUpdateExcel,
  formatRupiah,
  formatPercent,
} from '../../lib/analysis'

async function mapHeadersWithGemini(rawHeaders, marketplace) {
  const prompt = `You are a data mapping assistant for e-commerce sales reports.
Identify each column's meaning among these categories:
  - order_id: order number
  - product_name: product name
  - sku: product SKU code
  - settlement_amount: total income/revenue (net settlement)
  - shipping_fee: shipping cost (ongkir)
  - platform_commission: marketplace admin fee
  - affiliate_commission: affiliate commission
  - refund: refund/return amount
  - product_price: original product price
  - quantity: number of units sold
Supported marketplaces: shopee, tiktok_shop, tokopedia, lazada.
Also support Indonesian terms (e.g. "ONGKIR", "TOTAL PEMASUKAN", "BIAYA ADMIN", "PENGEMBALIAN DANA").

Headers to classify: ${rawHeaders.join(', ')}

Rules:
1. Output JSON like: {"header": "raw header", "category": "order_id", "confidence": 0.95}
2. If unsure, set confidence < 0.5
3. Only respond with valid JSON array
4. No explanations outside JSON

Respond with JSON only.
`

  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    })
    const data = await res.json()
    const candidates = data.candidates || []
    const text = candidates[0]?.content?.parts?.[0]?.text || '[]'
    let parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) parsed = []

    const mapping = {}
    parsed.forEach((item) => {
      const h = String(item.header || '').trim()
      const cat = item.category
      if (!h || !cat) return
      const catMap = {
        order_id: 'orderId', product_name: 'productName', sku: 'sku',
        settlement_amount: 'settlementAmount', shipping_fee: 'shippingFee',
        platform_commission: 'platformCommission', affiliate_commission: 'affiliateCommission',
        refund: 'refund', product_price: 'productPrice', quantity: 'quantity',
        product_weight: 'productWeight', shipping_estimate: 'shippingEstimate',
        buyer_shipping: 'buyerShipping', resi: 'resi',
      }
      const canonical = catMap[cat]
      if (canonical && !mapping[canonical]) {
        mapping[canonical] = h
      }
    })
    return mapping
  } catch (err) {
    console.error('Gemini header mapping failed:', err)
    return {}
  }
}

export async function POST(req) {
  try {
    const { data, useGemini, marketplace } = await req.json()

    if (!data || !Array.isArray(data)) {
      return new Response(JSON.stringify({ error: 'Data tidak valid' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if payload is a binary file upload (has buffer + name)
    if (data.buffer && data.name) {
      const { records, headers } = await parseExcelFile(data)
      const mapping = useGemini && process.env.GEMINI_API_KEY
        ? await mapHeadersWithGemini(headers, marketplace)
        : smartMapHeaders(headers, marketplace)
      const result = calculateAnalysis(records, mapping, {}, marketplace)
      return new Response(JSON.stringify(result), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Gemini-powered mode (frontend sends unmapped rows + headers)
    if (useGemini && process.env.GEMINI_API_KEY) {
      const rawHeaders = data.headers || []
      const mapping = await mapHeadersWithGemini(rawHeaders, marketplace)
      if (Object.keys(mapping).length === 0) {
        const { smartMapHeaders } = await import('../../lib/analysis')
        const fallback = smartMapHeaders(rawHeaders, marketplace)
        Object.assign(mapping, fallback.mapping)
      }
      const result = calculateAnalysis(data.rows, mapping, {}, marketplace)
      result.analysis = {
        type: 'gemini_powered',
        message: 'Analisis menggunakan Gemini AI untuk pemetaan kolom',
      }
      return new Response(JSON.stringify(result), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Standard mode: expect { records, mapping }
    const records = data.records || []
    const mapping = data.mapping || {}
    const result = calculateAnalysis(records, mapping, {}, marketplace)
    return new Response(JSON.stringify(result), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
