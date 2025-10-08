import React, { useState } from 'react';
import { RoomType, NotificationSettings } from '../types';
import { DollarSign, Edit2, Save, X, Plus } from 'lucide-react';

interface RoomPricingSettingsProps {
  roomTypes: RoomType[];
  onUpdateRoomTypes: (roomTypes: RoomType[]) => void;
  notificationSettings: NotificationSettings;
  onSendPriceChangeNotification: (roomType: RoomType, oldPrice: number, newPrice: number) => void;
}

export const RoomPricingSettings: React.FC<RoomPricingSettingsProps> = ({
  roomTypes,
  onUpdateRoomTypes,
  notificationSettings,
  onSendPriceChangeNotification,
}) => {
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; basePrice: number; description: string }>({
    name: '',
    basePrice: 0,
    description: '',
  });
  const [isAddingNew, setIsAddingNew] = useState(false);

  const startEditing = (room: RoomType) => {
    setEditingRoom(room.id);
    setEditValues({
      name: room.name,
      basePrice: room.basePrice,
      description: room.description || '',
    });
  };

  const startAddingNew = () => {
    setIsAddingNew(true);
    setEditValues({
      name: '',
      basePrice: 0,
      description: '',
    });
  };

  const saveRoom = () => {
    if (editingRoom) {
      // Update existing room
      const existingRoom = roomTypes.find(room => room.id === editingRoom);
      const oldPrice = existingRoom?.basePrice || 0;
      const newPrice = editValues.basePrice;
      
      const updatedRoomTypes = roomTypes.map(room =>
        room.id === editingRoom
          ? {
              ...room,
              name: editValues.name,
              basePrice: editValues.basePrice,
              description: editValues.description,
            }
          : room
      );
      onUpdateRoomTypes(updatedRoomTypes);
      
      // Send notification if price changed and notifications are enabled
      if (existingRoom && oldPrice !== newPrice && notificationSettings.priceChangeNotifications.enabled) {
        const updatedRoom = { ...existingRoom, name: editValues.name, basePrice: newPrice, description: editValues.description };
        onSendPriceChangeNotification(updatedRoom, oldPrice, newPrice);
      }
      
      setEditingRoom(null);
    } else if (isAddingNew) {
      // Add new room
      const newRoom: RoomType = {
        id: Date.now().toString(),
        name: editValues.name,
        basePrice: editValues.basePrice,
        description: editValues.description,
      };
      onUpdateRoomTypes([...roomTypes, newRoom]);
      setIsAddingNew(false);
    }
  };

  const cancelEditing = () => {
    setEditingRoom(null);
    setIsAddingNew(false);
    setEditValues({ name: '', basePrice: 0, description: '' });
  };

  const deleteRoom = (roomId: string) => {
    if (window.confirm('Are you sure you want to delete this room type? This action cannot be undone.')) {
      onUpdateRoomTypes(roomTypes.filter(room => room.id !== roomId));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <DollarSign className="w-6 h-6 mr-3 text-green-600" />
          Room Pricing Settings
        </h2>
        
        <button
          onClick={startAddingNew}
          disabled={isAddingNew || editingRoom !== null}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Room Type
        </button>
      </div>

      <div className="space-y-4">
        {roomTypes.map(room => (
          <div key={room.id} className="border border-gray-200 rounded-lg p-4">
            {editingRoom === room.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Room Type Name
                    </label>
                    <input
                      type="text"
                      value={editValues.name}
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Base Price per Night ($)
                    </label>
                    <input
                      type="text"
                      value={editValues.basePrice.toString()}
                      onChange={(e) => setEditValues({ ...editValues, basePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editValues.description}
                    onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Brief description of the room type..."
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={saveRoom}
                    disabled={!editValues.name || editValues.basePrice <= 0}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
                  <h3 className="text-lg font-semibold text-gray-800">{room.name}</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ${room.basePrice.toFixed(2)} <span className="text-sm text-gray-500">per night</span>
                  </p>
                  {room.description && (
                    <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(room)}
                    disabled={editingRoom !== null || isAddingNew}
                    className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => deleteRoom(room.id)}
                    disabled={editingRoom !== null || isAddingNew}
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

        {isAddingNew && (
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Room Type</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Type Name
                  </label>
                  <input
                    type="text"
                    value={editValues.name}
                    onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Deluxe Suite"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Base Price per Night ($)
                  </label>
                  <input
                    type="text"
                    value={editValues.basePrice.toString()}
                    onChange={(e) => setEditValues({ ...editValues, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={editValues.description}
                  onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Brief description of the room type..."
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={saveRoom}
                  disabled={!editValues.name || editValues.basePrice <= 0}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Add Room Type
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

        {roomTypes.length === 0 && !isAddingNew && (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No room types configured</p>
            <p>Add your first room type to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};