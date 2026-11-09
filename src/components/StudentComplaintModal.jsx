import { useState } from 'react';
import { X, ShieldCheck, Upload, AlertTriangle, ChevronRight } from 'lucide-react';
import { STUDENT_CATEGORIES } from './StudentDashboard';
import { api } from '../services/api';

const BLOCK_OPTIONS = [
  'Academic Block A',
  'Academic Block B',
  'Gargi Hostel (Girls)',
  'Vikram Hostel (Boys)',
  'Tagore Hostel (Boys)',
  'Main Dining Complex & Mess',
  'Central Library',
  'Sports Complex & Gym',
  'Administrative Block',
  'Campus Grounds & Pathways',
];

export function StudentComplaintModal({ user, onClose, onSubmitted }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(STUDENT_CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState('');
  const [block, setBlock] = useState('Academic Block A');
  const [location, setLocation] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [attachmentName, setAttachmentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Please provide a title, description, and specific location.');
      return;
    }

    try {
      setLoading(true);
      const created = await api.submitComplaint({
        title: title.trim(),
        description: description.trim(),
        category,
        subcategory: subcategory.trim() || undefined,
        block,
        location: location.trim(),
        roomNumber: roomNumber.trim() || undefined,
        priority,
        attachment: attachmentName || undefined,
      });

      onSubmitted(created);
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal student-submit-modal" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Student Grievance Lodging</p>
            <h2>Submit a New Complaint</h2>
            <small>Student: {user.name} ({user.collegeId})</small>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>

        {error && (
          <div className="modal-alert-error" role="alert">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Complaint Title */}
        <label>
          Complaint Title *
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Broken bench in LH 202 or Water cooler not cooling"
            autoFocus
          />
        </label>

        {/* Category & Subcategory */}
        <div className="form-row-2">
          <label>
            Category *
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                // Adjust block default if hostel/mess chosen
                if (e.target.value.includes('Hostel')) {
                  setBlock('Gargi Hostel (Girls)');
                } else if (e.target.value.includes('Mess')) {
                  setBlock('Main Dining Complex & Mess');
                }
              }}
            >
              {STUDENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label>
            Subcategory / Specific Issue (Optional)
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. Ceiling Fan, Projector HDMI, Dal Hygiene"
            />
          </label>
        </div>

        {/* Block / Campus Area & Location */}
        <div className="form-row-2">
          <label>
            Campus Block / Complex *
            <select value={block} onChange={(e) => setBlock(e.target.value)}>
              {BLOCK_OPTIONS.map((blk) => (
                <option key={blk} value={blk}>
                  {blk}
                </option>
              ))}
            </select>
          </label>

          <label>
            Room / Floor / Specific Spot *
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 2nd Floor, Room 204 or Staircase B"
            />
          </label>
        </div>

        {/* Priority & Attachment */}
        <div className="form-row-2">
          <label>
            Priority Level
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="Low">Low (General suggestion/routine)</option>
              <option value="Medium">Medium (Standard attention needed)</option>
              <option value="High">High (Impacting classes/living conditions)</option>
              <option value="Critical">Critical (Immediate safety/hazard)</option>
            </select>
          </label>

          <label>
            Attach Photo / Supporting File (Optional)
            <div className="file-upload-input-wrap">
              <input type="file" onChange={handleFileChange} />
              {attachmentName && <span className="attached-filename">✓ {attachmentName}</span>}
            </div>
          </label>
        </div>

        {/* Detailed Description */}
        <label>
          Detailed Description *
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue clearly, mentioning any specific damages, timings, or safety hazards..."
          />
        </label>

        {/* Smart Routing Preview Note */}
        <div className="smart-routing-note">
          <ShieldCheck size={16} />
          <span>
            {category.includes('Hostel') || category.includes('Mess')
              ? 'This issue will be automatically routed to the Hostel & Mess Department for warden review.'
              : category.includes('Classroom') || category.includes('Furniture')
              ? 'This issue will be routed to the Academic Block Coordinator & Department HOD.'
              : 'This issue will be routed to the Campus Infrastructure Admin & Maintenance Squad.'}
          </span>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Submitting & Routing...' : 'Submit Complaint'} <ChevronRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
