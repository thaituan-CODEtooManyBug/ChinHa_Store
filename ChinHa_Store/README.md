# Chin Ha Store

## Project Overview
Chin Ha Store is an online platform for renting cameras. This project includes a user-friendly interface for customers to view and rent cameras, as well as an admin dashboard for managing camera inventory and monitoring rental activities.

## File Structure
The project consists of the following key files and directories:

- **assets/**: Contains all static assets including CSS, JavaScript, and images.
  - **css/**: Contains the main CSS file for styling the project.
  - **js/**: Contains JavaScript files for handling client-side logic.
- **admin.html**: The admin dashboard for monitoring and managing cameras.
- **chinha_store_API.py**: The backend API built with FastAPI for managing camera data and rentals.
- **index.html**: The main landing page of the store.
- **lien-he.html**: The contact page for customer inquiries.
- **Product Pages**: Individual HTML files for different camera models.
- **chinh-sach-thue.html**: The rental policy page.
- **rent_logic.txt**: Document outlining rental logic and conditions.
- **README.md**: This documentation file.

## Features
- **User Interface**: A clean and responsive design for easy navigation.
- **Admin Dashboard**: A dedicated page for admins to manage camera inventory, view rental statistics, and handle bookings.
- **API Integration**: Utilizes FastAPI to manage camera data and rental transactions.

## Getting Started
To run the project locally, follow these steps:

1. Clone the repository to your local machine.
2. Install the required dependencies for the FastAPI backend.
3. Run the FastAPI server using the command:
   ```
   uvicorn chinha_store_API:app --reload
   ```
4. Open `index.html` in your web browser to access the store.

## Future Enhancements
- Implement user authentication for the admin dashboard.
- Add more detailed rental statistics and reporting features.
- Improve the user interface with additional styling and animations.

## License
This project is licensed under the MIT License.