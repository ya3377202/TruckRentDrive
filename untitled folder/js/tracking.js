class TruckTracker {
    constructor() {
        this.map = null;
        this.markers = new Map();
        this.trucks = [];
        this.socket = null;
        this.updateInterval = null;
    }

    init(mapElementId) {
        // Initialize the map
        this.map = L.map(mapElementId).setView([39.8283, -98.5795], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        // Initialize demo trucks
        this.trucks = [
            { id: 'T1', name: "Truck #1", type: "Standard", status: "Available", 
              position: { lat: 40.7128, lng: -74.0060 }, // New York
              destination: "New York City", eta: "2 hours" },
            { id: 'T2', name: "Truck #2", type: "Heavy Duty", status: "In Transit", 
              position: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
              destination: "Los Angeles", eta: "1 hour" },
            { id: 'T3', name: "Truck #3", type: "Refrigerated", status: "Loading", 
              position: { lat: 41.8781, lng: -87.6298 }, // Chicago
              destination: "Chicago", eta: "30 minutes" }
        ];

        // Add markers for each truck
        this.trucks.forEach(truck => this.addTruckMarker(truck));

        // Start real-time updates
        this.startUpdates();
    }

    addTruckMarker(truck) {
        const marker = L.marker([truck.position.lat, truck.position.lng], {
            icon: this.getTruckIcon(truck.type)
        }).addTo(this.map);

        // Create custom popup content
        const popupContent = this.createPopupContent(truck);
        marker.bindPopup(popupContent);

        this.markers.set(truck.id, marker);
    }

    getTruckIcon(type) {
        // Custom icons for different truck types
        const iconUrl = type === 'Refrigerated' ? 'images/icons/refrigerated-truck.png' :
                       type === 'Heavy Duty' ? 'images/icons/heavy-truck.png' :
                       'images/icons/standard-truck.png';

        return L.icon({
            iconUrl: iconUrl,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    }

    createPopupContent(truck) {
        return `
            <div class="truck-popup">
                <h3 class="font-bold">${truck.name}</h3>
                <div class="truck-details">
                    <p><strong>Type:</strong> ${truck.type}</p>
                    <p><strong>Status:</strong> 
                        <span class="${this.getStatusColor(truck.status)}">
                            ${truck.status}
                        </span>
                    </p>
                    <p><strong>Destination:</strong> ${truck.destination}</p>
                    <p><strong>ETA:</strong> ${truck.eta}</p>
                </div>
            </div>
        `;
    }

    getStatusColor(status) {
        switch (status.toLowerCase()) {
            case 'available': return 'text-green-600';
            case 'in transit': return 'text-blue-600';
            case 'loading': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    }

    startUpdates() {
        // Simulate real-time updates
        this.updateInterval = setInterval(() => {
            this.trucks.forEach(truck => {
                // Simulate movement
                truck.position.lat += (Math.random() - 0.5) * 0.01;
                truck.position.lng += (Math.random() - 0.5) * 0.01;

                // Update marker position
                const marker = this.markers.get(truck.id);
                if (marker) {
                    marker.setLatLng([truck.position.lat, truck.position.lng]);
                    marker.getPopup().setContent(this.createPopupContent(truck));
                }
            });
        }, 5000); // Update every 5 seconds
    }

    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    // Find nearest available truck to a location
    findNearestTruck(location) {
        let nearest = null;
        let minDistance = Infinity;

        this.trucks.forEach(truck => {
            if (truck.status === 'Available') {
                const distance = this.calculateDistance(
                    location.lat, location.lng,
                    truck.position.lat, truck.position.lng
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = truck;
                }
            }
        });

        return nearest;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula for calculating distance between two points
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
}

// Initialize tracker when the page loads
window.truckTracker = new TruckTracker(); 