const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const config = {
    user:'sa',
    password:'123456789',
    server: 'localhost\\MSSQLSERVER01',
    database: 'ExpenseClaimDB',
    driver: 'msnodesqlv8',
    options: {
      trustedConnection: true,
      trustServerCertificate: true
    }
  };

sql.connect(config, err => {
  if (err) console.log(err);
  else console.log('Connected to MSSQL');
});

const upload = multer({ dest: 'uploads/' });

app.post('/api/submit-claim', upload.single('billAttachment'), (req, res) => {
  const {
    employeeName, employeeCode, designation, department,
    expenseCategory, claimAmount, expenseDate,
    expenseLocation, remarks
  } = req.body;

  let { expenseSubcategory } = req.body;

  // Ensure expenseSubcategory is an array
  if (!Array.isArray(expenseSubcategory)) {
    expenseSubcategory = [expenseSubcategory];
  }

  const billAttachment = req.file ? req.file.filename : null;

  const request = new sql.Request();
  request.input('employeeName', sql.VarChar, employeeName);
  request.input('employeeCode', sql.VarChar, employeeCode);
  request.input('designation', sql.VarChar, designation);
  request.input('department', sql.VarChar, department);
  request.input('expenseCategory', sql.VarChar, expenseCategory);
  request.input('expenseSubcategory', sql.VarChar, expenseSubcategory.join(','));
  request.input('claimAmount', sql.Int, claimAmount);
  request.input('expenseDate', sql.Date, expenseDate);
  request.input('expenseLocation', sql.VarChar, expenseLocation);
  request.input('billAttachment', sql.VarChar, billAttachment);
  request.input('remarks', sql.VarChar, remarks);

  request.query(`
    INSERT INTO Claims (
      employeeName, employeeCode, designation, department, expenseCategory,
      expenseSubcategory, claimAmount, expenseDate, expenseLocation,
      billAttachment, remarks
    ) VALUES (
      @employeeName, @employeeCode, @designation, @department, @expenseCategory,
      @expenseSubcategory, @claimAmount, @expenseDate, @expenseLocation,
      @billAttachment, @remarks
    )
  `, (err, result) => {
    if (err) res.status(500).send(err);
    else res.send(result);
  });
});

app.get('/api/total-claim-amount', (req, res) => {
  const request = new sql.Request();
  request.query('SELECT SUM(claimAmount) as total FROM Claims', (err, result) => {
    if (err) res.status(500).send(err);
    else res.send({ total: result.recordset[0].total });
  });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));