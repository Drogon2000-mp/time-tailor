import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Flatpickr from 'react-flatpickr';
import "flatpickr/dist/flatpickr.min.css";
import { toast } from 'react-toastify';
import './appointment.css';
function BookAppointment() {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: 'measurement',
    notes: '',
    phone: '',
    email: '',
    district: '',
    area: '',
    fullAddress: '',
  });
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const phoneRegex = /^(98|97)\d{8}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Load user profile
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.data);
        setFormData(prev => ({
          ...prev,
          phone: res.data.data.phone || '',
          email: res.data.data.email || ''
        }));
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
      }
    };
    loadUser();
  }, [navigate]);

  const loadSlots = async (dateStr) => {
    setLoadingSlots(true);
    try {
      const res = await api.get(`/appointments/slots/available?date=${dateStr}`);
      setTimeSlots(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load slots');
      setTimeSlots([]);
    }
    setLoadingSlots(false);
  };

  const handleDateChange = (date) => {
    if (!date) return;
    const dateStr = date.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: dateStr, time: '' }));
    loadSlots(dateStr);
  };

  const validate = () => {
    if (!formData.date) return 'Date required';
    if (!formData.time) return 'Time required';
    if (!formData.phone || !phoneRegex.test(formData.phone)) return 'Valid Nepali phone required (98/97xxxxxxxx)';
    if (formData.email && !emailRegex.test(formData.email)) return 'Invalid email';
    if (!formData.district?.trim() || formData.district.length < 3) return 'District required (min 3 chars)';
    if (!formData.area?.trim() || formData.area.length < 3) return 'Area required (min 3 chars)';
    if (!formData.fullAddress?.trim() || formData.fullAddress.length < 5) return 'Full address required (min 5 chars)';
    return null;
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      const error = validate();
      if (error) return toast.error(error);
      
      setLoading(true);
      try {
        const submitData = {
          ...formData,
          location: {
            address: `${formData.district || ''}, ${formData.area || ''}, ${formData.fullAddress || ''}`.trim()
          }
        };
        await api.post('/appointments', submitData);
        toast.success('Booked! Awaiting approval.');
        navigate('/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Booking failed');
      }
      setLoading(false);
    };

  return (
    <div className="appointment-container">
      <h2>Book Appointment</h2>
      <form onSubmit={handleSubmit} className="appointment-form">
        <div>
          <label>Date *</label>
          <Flatpickr
            value={formData.date ? new Date(formData.date) : null}
            onChange={([date]) => handleDateChange(date)}
            options={{
              minDate: 'today',
              maxDate: new Date(Date.now() + 30*24*60*60*1000), // 30 days
              dateFormat: 'Y-m-d'
            }}
            className="date-picker"
            placeholder="Select date"
          />
        </div>

        <div>
          <label>Time *</label>
          <div className="time-slots">
            {loadingSlots ? 'Loading...' : timeSlots.map(slot => (
              <button
                type="button"
                key={slot.time}
                className={`time-slot ${formData.time === slot.time ? 'active' : ''}`}
                disabled={!slot.available}
                onClick={() => setFormData(prev => ({ ...prev, time: slot.time }))}
              >
                {slot.display} { !slot.available && '(Booked)'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label>Type *</label>
          <select value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value}))} className="form-select">
            <option value="consultation">Consultation</option>
            <option value="measurement">Measurement</option>
            <option value="fitting">Fitting</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        <div>
        <label>Phone * REQUIRED (Nepali 98/97xxxxxxxx format)</label>
          <input
            type="tel"
            value={formData.phone ?? ''}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value || undefined }))}
            className="form-input"
            placeholder="9841234567"
          />
        </div>

        <div>
          <label>Email (optional)</label>
          <input
            type="email"
            value={formData.email ?? ''}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value || undefined }))}
            className="form-input"
            placeholder="user@example.com"
          />
        </div>

        <div className="form-row">
          <div>
            <label>District *</label>
            <input
              type="text"
              value={formData.district ?? ''}
              onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
              className="form-input"
              placeholder="Kathmandu"
              required
            />
          </div>
          <div>
            <label>Area *</label>
            <input
              type="text"
              value={formData.area ?? ''}
              onChange={e => setFormData(prev => ({ ...prev, area: e.target.value }))}
              className="form-input"
              placeholder="Thamel"
              required
            />
          </div>
        </div>

        <div>
          <label>Full Address *</label>
          <input
            type="text"
            value={formData.fullAddress ?? ''}
            onChange={e => setFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
            className="form-input"
            placeholder="Street no, house no, landmarks"
            required
          />
        </div>

        <div>
          <label>Notes (optional)</label>
          <textarea
            value={formData.notes || ''}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="form-textarea"
            placeholder="Special requirements..."
            rows="3"
          />
        </div>

        <button type="submit" disabled={loading} className="book-btn">
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>
    </div>
  );
}

export default BookAppointment;

