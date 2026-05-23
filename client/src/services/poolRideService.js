import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const createPoolRide = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/pool-rides/create`, data, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const searchPoolRides = async (searchData) => {
    try {
        const response = await axios.post(`${API_URL}/pool-rides/search`, searchData, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const joinPoolRide = async (poolRideId, joinData) => {
    try {
        const response = await axios.post(`${API_URL}/pool-rides/${poolRideId}/join`, joinData, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updatePassengerStatus = async (poolRideId, passengerId, status) => {
    try {
        const response = await axios.patch(
            `${API_URL}/pool-rides/${poolRideId}/passenger/${passengerId}`,
            { status },
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getPoolRideDetails = async (poolRideId) => {
    try {
        const response = await axios.get(`${API_URL}/pool-rides/${poolRideId}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
