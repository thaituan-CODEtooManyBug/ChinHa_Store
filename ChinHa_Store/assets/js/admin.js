// This file contains JavaScript functions specific to the admin dashboard for managing cameras.

document.addEventListener('DOMContentLoaded', function() {
    const cameraList = document.getElementById('camera-list');
    const addCameraForm = document.getElementById('add-camera-form');
    const editCameraForm = document.getElementById('edit-camera-form');
    const apiUrl = '/api/cameras'; // Adjust the API endpoint as necessary

    // Fetch and display cameras
    function fetchCameras() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                cameraList.innerHTML = '';
                data.forEach(camera => {
                    const cameraItem = document.createElement('div');
                    cameraItem.className = 'camera-item';
                    cameraItem.innerHTML = `
                        <h3>${camera.name} (${camera.model})</h3>
                        <p>Status: ${camera.status}</p>
                        <button onclick="editCamera(${camera.id})">Edit</button>
                        <button onclick="deleteCamera(${camera.id})">Delete</button>
                    `;
                    cameraList.appendChild(cameraItem);
                });
            })
            .catch(error => console.error('Error fetching cameras:', error));
    }

    // Add new camera
    addCameraForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(addCameraForm);
        fetch(apiUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            fetchCameras();
            addCameraForm.reset();
        })
        .catch(error => console.error('Error adding camera:', error));
    });

    // Edit camera
    window.editCamera = function(cameraId) {
        // Fetch camera details and populate the edit form
        fetch(`${apiUrl}/${cameraId}`)
            .then(response => response.json())
            .then(camera => {
                editCameraForm.elements['name'].value = camera.name;
                editCameraForm.elements['model'].value = camera.model;
                editCameraForm.elements['status'].value = camera.status;
                editCameraForm.elements['id'].value = camera.id;
            });
    };

    // Update camera
    editCameraForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(editCameraForm);
        const cameraId = formData.get('id');
        fetch(`${apiUrl}/${cameraId}`, {
            method: 'PUT',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            fetchCameras();
            editCameraForm.reset();
        })
        .catch(error => console.error('Error updating camera:', error));
    });

    // Delete camera
    window.deleteCamera = function(cameraId) {
        fetch(`${apiUrl}/${cameraId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                fetchCameras();
            }
        })
        .catch(error => console.error('Error deleting camera:', error));
    };

    // Initial fetch of cameras
    fetchCameras();
});