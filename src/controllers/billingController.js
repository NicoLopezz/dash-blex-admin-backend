const db = require('../config/database');

/**
 * GET /api/invoices
 * Obtener lista de facturas
 * Nota: Por ahora devuelve datos mock ya que la funcionalidad de facturación
 * no está implementada en la base de datos
 */
const getInvoices = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Datos mock de ejemplo
    // TODO: Implementar lógica real cuando se tenga el modelo de facturas
    const mockInvoices = [
      {
        id: "#MS-415646",
        date: "March, 01, 2020",
        price: "$180"
      },
      {
        id: "#RV-126749",
        date: "February, 10, 2021",
        price: "$250"
      },
      {
        id: "#QW-103578",
        date: "April, 05, 2020",
        price: "$120"
      },
      {
        id: "#MS-415646",
        date: "June, 25, 2019",
        price: "$180"
      },
      {
        id: "#AR-803481",
        date: "March, 01, 2019",
        price: "$300"
      }
    ];

    const invoices = mockInvoices.slice(0, parseInt(limit));

    res.status(200).json({
      invoices,
    });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener facturas',
      error: error.message,
    });
  }
};

/**
 * GET /api/billing/transactions
 * Obtener transacciones de billing/pagos
 * Nota: Por ahora devuelve datos mock ya que la funcionalidad de billing
 * no está completamente implementada
 */
const getBillingTransactions = async (req, res) => {
  try {
    // Datos mock de ejemplo
    // TODO: Implementar lógica real cuando se tenga el modelo de billing completo
    const mockData = {
      newest: [
        {
          name: "Netflix",
          description: "27 March 2020, at 12:30 PM",
          value: "- $ 2,500",
          type: "expense"
        },
        {
          name: "Apple",
          description: "27 March 2020, at 04:30 AM",
          value: "+ $ 2,000",
          type: "income"
        }
      ],
      yesterday: [
        {
          name: "Stripe",
          description: "26 March 2020, at 13:45 PM",
          value: "+ $ 750",
          type: "income"
        },
        {
          name: "HubSpot",
          description: "26 March 2020, at 12:30 PM",
          value: "+ $ 1,000",
          type: "income"
        },
        {
          name: "Creative Tim",
          description: "26 March 2020, at 08:30 AM",
          value: "+ $ 2,500",
          type: "income"
        },
        {
          name: "Webflow",
          description: "26 March 2020, at 05:00 AM",
          value: "Pending",
          type: "pending"
        }
      ]
    };

    res.status(200).json(mockData);
  } catch (error) {
    console.error('Error al obtener transacciones de billing:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones de billing',
      error: error.message,
    });
  }
};

module.exports = {
  getInvoices,
  getBillingTransactions,
};
