// src/components/ClaimForm.js
import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const ClaimForm = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [totalClaimAmount, setTotalClaimAmount] = useState(0);
  const [error,setError] = useState('');

  const categoryOptions = {
    Food: ['Beverage', 'Snacks', 'Meal'],
    Travel: ['Taxi', 'Flight', 'Train']
  };

  const designationLimits = {
    CEO: 10000,
    Manager: 7000
  };

  const validationSchema = Yup.object({
    employeeName: Yup.string().required('Required'),
    employeeCode: Yup.string().required('Required'),
    designation: Yup.string().required('Required'),
    department: Yup.string().required('Required'),
    expenseCategory: Yup.string().required('Required'),
    expenseSubcategory: Yup.array().of(Yup.string()).required('Required'),
    claimAmount: Yup.number()
      .required('Required')
      .test('max-amount', 'Claim amount exceeds limit', function (value) {
        return value <= designationLimits[this.parent.designation];
      }),
    expenseDate: Yup.date().required('Required'),
    expenseLocation: Yup.string().required('Required'),
    billAttachment: Yup.mixed().required('Required'),
    remarks: Yup.string().required('Required')
  });

  const fetchTotalClaimAmount = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/total-claim-amount');
      setTotalClaimAmount(response.data.total);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTotalClaimAmount();
  }, []);

  return (
    <div>
      <Formik
        initialValues={{
          employeeName: '',
          employeeCode: '',
          designation: '',
          department: '',
          expenseCategory: '',
          expenseSubcategory: [],
          claimAmount: '',
          expenseDate: '',
          expenseLocation: '',
          billAttachment: null,
          remarks: ''
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          const formData = new FormData();
          for (const key in values) {
            if (key === 'expenseSubcategory') {
              values[key].forEach(subcat => formData.append(key, subcat));
            } else {
              formData.append(key, values[key]);
            }
          }

          axios.post('http://localhost:5000/api/submit-claim', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
            .then(response => {
              console.log(response);
              setSubmitting(false);
              alert('submitted successfully')
              fetchTotalClaimAmount();
            })
            .catch(error => {
              console.error(error);
              alert('Something went wrong')
              setSubmitting(false);
            });
        }}
      >
        {({ setFieldValue }) => (
          <Form>
            <label>Employee Name:</label>
            <Field name="employeeName" type="text" />
            <ErrorMessage name="employeeName" component="div" />

            <label>Employee Code:</label>
            <Field name="employeeCode" type="text" />
            <ErrorMessage name="employeeCode" component="div" />

            <label>Designation:</label>
            <Field name="designation" as="select">
              <option value="">Select</option>
              <option value="CEO">CEO</option>
              <option value="Manager">Manager</option>
            </Field>
            <ErrorMessage name="designation" component="div" />

            <label>Department:</label>
            <Field name="department" type="text" />
            <ErrorMessage name="department" component="div" />

            <label>Expense Category:</label>
            <Field name="expenseCategory" as="select" onChange={e => {
              setFieldValue('expenseCategory', e.target.value);
              setSubcategories(categoryOptions[e.target.value] || []);
            }}>
              <option value="">Select</option>
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
            </Field>
            <ErrorMessage name="expenseCategory" component="div" />

            <label>Expense Subcategory:</label>
            <Field name="expenseSubcategory" as="select" multiple onChange={e => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              setFieldValue('expenseSubcategory', selectedOptions);
            }}>
              {subcategories.map(subcat => (
                <option key={subcat} value={subcat}>{subcat}</option>
              ))}
            </Field>
            <ErrorMessage name="expenseSubcategory" component="div" />

            <label>Claim Amount:</label>
            <Field name="claimAmount" type="number" />
            <ErrorMessage name="claimAmount" component="div" />

            <label>Expense Date:</label>
            <Field name="expenseDate" type="date" />
            <ErrorMessage name="expenseDate" component="div" />

            <label>Expense Location:</label>
            <Field name="expenseLocation" type="text" />
            <ErrorMessage name="expenseLocation" component="div" />

            <label>Bill Attachment:</label>
            <input
              name="billAttachment"
              type="file"
              onChange={(event) => {
                setFieldValue("billAttachment", event.currentTarget.files[0]);
              }}
            />
            <ErrorMessage name="billAttachment" component="div" />

            <label>Remarks:</label>
            <Field name="remarks" type="text" />
            <ErrorMessage name="remarks" component="div" />

            <button type="submit">Submit</button>
          </Form>
        )}
      </Formik>
      <h2>Total Claim Amount: {totalClaimAmount}</h2>
    </div>
  );
};

export default ClaimForm;
