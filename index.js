const express = require('express');
const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint para generar etiqueta
app.post('/generar-etiqueta', async (req, res) => {
  try {
    // Decodificar y limpiar valores
    let codigo = req.body.codigo || '';
    let nombre = req.body.nombre || '';
    let sku = req.body.sku || '';
    
    try {
      codigo = decodeURIComponent(codigo).trim();
    } catch(e) {
      codigo = codigo.trim();
    }
    
    try {
      nombre = decodeURIComponent(nombre).trim();
    } catch(e) {
      nombre = nombre.trim();
    }
    
    try {
      sku = decodeURIComponent(sku).trim();
    } catch(e) {
      sku = sku.trim();
    }
    
    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'Faltan campos: codigo y nombre son requeridos' });
    }

    // Generar código de barras como PNG
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: codigo,
      scale: 3,
      height: 12,
      includetext: false,
    });

    // Crear PDF 6x4 cm (170 x 113 puntos)
    const doc = new PDFDocument({
      size: [170, 113],
      margins: { top: 8, bottom: 8, left: 8, right: 8 }
    });

    // Limpiar nombre para filename (quitar caracteres especiales)
    const safeFilename = nombre.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]/g, '').substring(0, 100);

    // Configurar respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`);
    
    doc.pipe(res);

    // Código de barras centrado
    doc.image(barcodeBuffer, 25, 12, { width: 120, height: 35 });

    // Código ML
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(codigo, 0, 50, { align: 'center', width: 170 });

    // Nombre del producto
    doc.fontSize(6).font('Helvetica-Bold');
    doc.text(nombre, 0, 64, { align: 'center', width: 170, lineGap: 1 });

    // SKU
    if (sku) {
      doc.fontSize(7).font('Helvetica-Bold');
      doc.text('Cod. Universal: ' + sku, 0, 95, { align: 'center', width: 170 });
    }

    doc.end();

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error generando etiqueta', details: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor de etiquetas BANVA activo' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
