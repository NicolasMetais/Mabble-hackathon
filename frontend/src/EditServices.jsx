import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const EditServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    jobs_id: "",
    description: "",
    price: "",
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const token = Cookies.get("authToken");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const res = await fetch("http://localhost:4000/services", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch services");
      }

      const data = await res.json();
      setServices(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const token = Cookies.get("authToken");
      const res = await fetch("http://localhost:4000/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobs_id: parseInt(formData.jobs_id),
          description: formData.description,
          price: parseInt(formData.price),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add service");
      }

      setFormData({ jobs_id: "", description: "", price: "" });
      setShowForm(false);
      fetchServices(); // Refresh list
    } catch (e) {
      setError(e.message);
    }
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
  };

  const closeDetails = () => {
    setSelectedService(null);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Services</h2>
      <button onClick={() => setShowForm(true)}>Add Service</button>

      {showForm && (
        <form onSubmit={handleAddService} style={{ marginTop: "20px", border: "1px solid #ccc", padding: "20px" }}>
          <h3>Add New Service</h3>
          <div>
            <label>Job ID:</label>
            <input
              type="number"
              value={formData.jobs_id}
              onChange={(e) => setFormData({ ...formData, jobs_id: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Price:</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          <button type="submit">Add</button>
          <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}

      <ul style={{ marginTop: "20px" }}>
        {services.map((service) => (
          <li key={service.id} style={{ cursor: "pointer", marginBottom: "10px" }} onClick={() => handleServiceClick(service)}>
            Service ID: {service.id} - Job ID: {service.jobs_id} - Price: {service.price}
          </li>
        ))}
      </ul>

      {selectedService && (
        <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "20px" }}>
          <h3>Service Details</h3>
          <p><strong>ID:</strong> {selectedService.id}</p>
          <p><strong>Job ID:</strong> {selectedService.jobs_id}</p>
          <p><strong>Description:</strong> {selectedService.description}</p>
          <p><strong>Price:</strong> {selectedService.price}</p>
          <button onClick={closeDetails}>Close</button>
        </div>
      )}
    </div>
  );
};

export default EditServices;
