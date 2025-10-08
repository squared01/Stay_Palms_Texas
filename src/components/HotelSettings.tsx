import React, { useState } from 'react';
import { HotelSettings as HotelSettingsType, Room, RoomType } from '../types';
import { Hotel, Plus, CreditCard as Edit2, Save, X, Settings, Bed, Wifi, Car, Coffee, Tv, Bath, Home } from 'lucide-react';

interface HotelSettingsProps {
  settings: HotelSettingsType;
  roomTypes: RoomType[];
  onUpdateSettings: (settings: HotelSettingsType) => void;
  onUpdateRoomTypes: (roomTypes: RoomType[]) => void;
}

const COMMON_AMENITIES = [
  { id: 'wifi', name: 'Free WiFi', icon: Wifi },
  { id: 'tv', name: 'Flat Screen TV', icon: Tv },
  { id: 'bathroom', name: 'Private Bathroom', icon: Bath },
  { id: 'parking', name: 'Free Parking', icon: Car },
  { id: 'coffee', name: 'Coffee Maker', icon: Coffee },
  { id: 'minibar', name: 'Mini Bar', icon: Coffee },
  { id: 'balcony', name: 'Balcony', icon: Bed },
  { id: 'ac', name: 'Air Conditioning', icon: Settings },
];

export const HotelSettings: React.FC<HotelSettingsProps> = ({
  settings,
  roomTypes,
  onUpdateSettings,
  onUpdateRoomTypes,
}) => {
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editingRoomType, setEditingRoomType] = useState<string | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isAddingRoomType, setIsAddingRoomType] = useState(false);
  const [roomFormData, setRoomFormData] = useState({ roomNumber: '', roomTypeId: '', isActive: true, amenities: [] as string[] });
  const [roomTypeFormData, setRoomTypeFormData] = useState({ 
    name: '', 
    basePrice: 0, 
    description: '',
    amenities: [] as string[]
  });

  const toggleRoomTypeAmenity = (amenityId: string) => {
    setRoomTypeFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const toggleRoomAmenity = (amenityId: string) => {
    setRoomFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const startEditingRoom = (room: Room) => {
    setEditingRoom(room.id);
    setRoomFormData({
      roomNumber: room.roomNumber,
      roomTypeId: room.roomTypeId,
      isActive: room.isActive,
      amenities: room.amenities || [],
    });
  };

  const startEditingRoomType = (roomType: RoomType) => {
    setEditingRoomType(roomType.id);
    setRoomTypeFormData({
      name: roomType.name,
      basePrice: roomType.basePrice,
      description: roomType.description || '',
      amenities: []
    });
  };

  const saveRoom = () => {
    if (editingRoom) {
      const updatedRooms = settings.rooms.map(room =>
        room.id === editingRoom
          ? { ...room, ...roomFormData }
          : room
      );
      onUpdateSettings({ ...settings, rooms: updatedRooms });
      setEditingRoom(null);
    } else if (isAddingRoom) {
      const newRoom: Room = {
        id: Date.now().toString(),
        ...roomFormData,
      };
      onUpdateSettings({ 
        ...settings, 
        rooms: [...settings.rooms, newRoom],
        totalRooms: settings.rooms.length + 1
      });
      setIsAddingRoom(false);
    }
    setRoomFormData({ roomNumber: '', roomTypeId: '', isActive: true, amenities: [] });
  };

  const saveRoomType = () => {
    if (editingRoomType) {
      const updatedRoomTypes = roomTypes.map(rt =>
        rt.id === editingRoomType
          ? { ...rt, ...roomTypeFormData }
          : rt
      );
      onUpdateRoomTypes(updatedRoomTypes);
      setEditingRoomType(null);
    } else if (isAddingRoomType) {
      const newRoomType: RoomType = {
        id: Date.now().toString(),
        ...roomTypeFormData,
      };
      onUpdateRoomTypes([...roomTypes, newRoomType]);
      setIsAddingRoomType(false);
    }
    setRoomTypeFormData({ name: '', basePrice: 0, description: '', amenities: [] });
  };

  const cancelEditing = () => {
    setEditingRoom(null);
    setEditingRoomType(null);
    setIsAddingRoom(false);
    setIsAddingRoomType(false);
    setRoomFormData({ roomNumber: '', roomTypeId: '', isActive: true, amenities: [] });
    setRoomTypeFormData({ name: '', basePrice: 0, description: '', amenities: [] });
  };

  const deleteRoom = (roomId: string) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      const updatedRooms = settings.rooms.filter(room => room.id !== roomId);
      onUpdateSettings({ 
        ...settings, 
        rooms: updatedRooms,
        totalRooms: updatedRooms.length
      });
    }
  };

  const deleteRoomType = (roomTypeId: string) => {
    const roomsUsingType = settings.rooms.filter(room => room.roomTypeId === roomTypeId);
    if (roomsUsingType.length > 0) {
      alert(`Cannot delete room type. ${roomsUsingType.length} room(s) are using this type.`);
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this room type?')) {
      onUpdateRoomTypes(roomTypes.filter(rt => rt.id !== roomTypeId));
    }
  };

  const getRoomTypeName = (roomTypeId: string) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    return roomType?.name || 'Unknown';
  };

  const getAmenityName = (amenityId: string) => {
    const amenity = COMMON_AMENITIES.find(a => a.id === amenityId);
    return amenity?.name || amenityId;
  };

  return (
    <div className="space-y-6">
      {/* Hotel Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Hotel className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Hotel Configuration</h2>
        </div>
        
        {/* Hotel Basic Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hotel Name
              </label>
              <input
                type="text"
                value={settings.hotelName}
                onChange={(e) => onUpdateSettings({ ...settings, hotelName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Check-in/Check-out Times */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Check-in & Check-out Times</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Standard Check-in Time
              </label>
              <input
                type="time"
                value={settings.checkInTime}
                onChange={(e) => onUpdateSettings({ ...settings, checkInTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">When guests can check into their rooms</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Standard Check-out Time
              </label>
              <input
                type="time"
                value={settings.checkOutTime}
                onChange={(e) => onUpdateSettings({ ...settings, checkOutTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">When guests must check out of their rooms</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Settings className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Current Policy:</p>
                <p>Check-in: {settings.checkInTime} • Check-out: {settings.checkOutTime}</p>
                <p className="mt-2 text-xs">These times will be displayed to guests and used for scheduling housekeeping and room preparation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Room Statistics */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Room Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <Hotel className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">Total Rooms</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">{settings.rooms.length}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <Bed className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">Room Types</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">{roomTypes.length}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">Active Rooms</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {settings.rooms.filter(room => room.isActive).length}
            </p>
          </div>
        </div>
        </div>
      </div>


      {/* Individual Rooms Management */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <Hotel className="w-5 h-5 mr-2 text-blue-600" />
            Individual Rooms ({settings.rooms.length})
          </h3>
          
          <button
            onClick={() => setIsAddingRoom(true)}
            disabled={isAddingRoom || editingRoom !== null || roomTypes.length === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </button>
        </div>

        {roomTypes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Bed className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Please create room types first before adding individual rooms</p>
          </div>
        )}

        {roomTypes.length > 0 && (
          <div className="space-y-4">
            {settings.rooms.map(room => (
              <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                {editingRoom === room.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Room Number/Name
                        </label>
                        <input
                          type="text"
                          value={roomFormData.roomNumber}
                          onChange={(e) => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Room Type
                        </label>
                        <select
                          value={roomFormData.roomTypeId}
                          onChange={(e) => setRoomFormData({ ...roomFormData, roomTypeId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select room type...</option>
                          {roomTypes.map(roomType => (
                            <option key={roomType.id} value={roomType.id}>
                              {roomType.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={roomFormData.isActive ? 'active' : 'inactive'}
                          onChange={(e) => setRoomFormData({ ...roomFormData, isActive: e.target.value === 'active' })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Room Amenities
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {COMMON_AMENITIES.map(amenity => {
                          const IconComponent = amenity.icon;
                          const isSelected = roomFormData.amenities.includes(amenity.id);
                          return (
                            <label
                              key={amenity.id}
                              className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleRoomAmenity(amenity.id)}
                                className="sr-only"
                              />
                              <IconComponent className="w-4 h-4 mr-2" />
                              <span className="text-sm font-medium">{amenity.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={saveRoom}
                        disabled={!roomFormData.roomNumber || !roomFormData.roomTypeId}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </button>
                      
                      <button
                        onClick={cancelEditing}
                        className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">Room {room.roomNumber}</h4>
                      <p className="text-gray-600">{getRoomTypeName(room.roomTypeId)}</p>
                      
                      {/* Room Amenities Display */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {room.amenities.map(amenityId => {
                              const amenity = COMMON_AMENITIES.find(a => a.id === amenityId);
                              if (!amenity) return null;
                              const IconComponent = amenity.icon;
                              return (
                                <span
                                  key={amenityId}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  <IconComponent className="w-3 h-3 mr-1" />
                                  {amenity.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                        room.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {room.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditingRoom(room)}
                        disabled={editingRoom !== null || isAddingRoom}
                        className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => deleteRoom(room.id)}
                        disabled={editingRoom !== null || isAddingRoom}
                        className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isAddingRoom && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Add New Room</h4>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Amenities
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {COMMON_AMENITIES.map(amenity => {
                      const IconComponent = amenity.icon;
                      const isSelected = roomFormData.amenities.includes(amenity.id);
                      return (
                        <label
                          key={amenity.id}
                          className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRoomAmenity(amenity.id)}
                            className="sr-only"
                          />
                          <IconComponent className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">{amenity.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Room Number/Name
                      </label>
                      <input
                        type="text"
                        value={roomFormData.roomNumber}
                        onChange={(e) => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 101, Ocean View, etc."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Room Type
                      </label>
                      <select
                        value={roomFormData.roomTypeId}
                        onChange={(e) => setRoomFormData({ ...roomFormData, roomTypeId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select room type...</option>
                        {roomTypes.map(roomType => (
                          <option key={roomType.id} value={roomType.id}>
                            {roomType.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={roomFormData.isActive ? 'active' : 'inactive'}
                        onChange={(e) => setRoomFormData({ ...roomFormData, isActive: e.target.value === 'active' })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Room Amenities
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {COMMON_AMENITIES.map(amenity => {
                        const IconComponent = amenity.icon;
                        const isSelected = roomFormData.amenities.includes(amenity.id);
                        return (
                          <label
                            key={amenity.id}
                            className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRoomAmenity(amenity.id)}
                              className="sr-only"
                            />
                            <IconComponent className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">{amenity.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={saveRoom}
                      disabled={!roomFormData.roomNumber || !roomFormData.roomTypeId}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Add Room
                    </button>
                    
                    <button
                      onClick={cancelEditing}
                      className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {settings.rooms.length === 0 && !isAddingRoom && (
              <div className="text-center py-8 text-gray-500">
                <Hotel className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No rooms configured</p>
                <p>Add your first room to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};