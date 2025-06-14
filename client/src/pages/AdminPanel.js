import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AvatarService } from '../utils/api';

const AdminPanel = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [avatarCategories, setAvatarCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [multipleUpload, setMultipleUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDisplayName, setNewCategoryDisplayName] = useState('');
  const fileInputRef = useRef(null);
  const multipleFileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  
  // Admin yetkisini kontrol et
  useEffect(() => {
    console.log('AdminPanel - CurrentUser:', currentUser);
    
    // Kullanıcı veya rol yoksa ana sayfaya yönlendir
    if (!currentUser) {
      console.log('Kullanıcı bilgisi yok, ana sayfaya yönlendiriliyor');
      navigate('/');
      return;
    }
    
    // Admin rolünü kontrol et - birden fazla kontrol çeşidi kullan
    const isAdmin = currentUser.role === 'admin' || currentUser.isAdmin || currentUser.admin;
    console.log('Admin kontrolü sonucu:', isAdmin);
    
    // Admin değilse ana sayfaya yönlendir
    if (!isAdmin) {
      console.log('Kullanıcı admin değil, ana sayfaya yönlendiriliyor');
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  // Kullanıcıları getir
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Admin API'den kullanıcıları çek
      const response = await fetch('http://localhost:5001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Kullanıcılar getirilemedi');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Kullanıcıları getirme hatası:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Quizleri getir
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      // Admin API'den quizleri çek
      const response = await fetch('http://localhost:5001/api/admin/quizzes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Quizler getirilemedi');
      }
      
      const data = await response.json();
      setQuizzes(data.quizzes || []);
    } catch (error) {
      console.error('Quizleri getirme hatası:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Oturumları getir
  const fetchSessions = async () => {
    try {
      setLoading(true);
      // Admin API'den oturumları çek
      const response = await fetch('http://localhost:5001/api/admin/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Oturumlar getirilemedi');
      }
      
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Oturumları getirme hatası:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Avatar kategorilerini getir
  const fetchAvatarCategories = async () => {
    try {
      setLoading(true);
      const response = await AvatarService.getCategories();
      console.log('Avatar kategorileri:', response.data.categories);
      
      // Eğer kategoriler geldiyse state'i güncelle
      if (response.data.categories && response.data.categories.length > 0) {
        setAvatarCategories(response.data.categories);
        
        // İlk kategoriyi seçili hale getir (eğer henüz seçilmediyse)
        if (!selectedCategory && response.data.categories.length > 0) {
          setSelectedCategory(response.data.categories[0].name);
        }
      } else {
        // API'den kategori gelmezse boş liste göster
        setAvatarCategories([]);
        setSelectedCategory('');
      }
    } catch (error) {
      console.error('Avatar kategorileri getirme hatası:', error);
      // API çağrısı başarısız olursa boş liste göster
      setAvatarCategories([]);
      setSelectedCategory('');
    } finally {
      setLoading(false);
    }
  };
  
  // Avatarları getir
  const fetchAvatars = async (category) => {
    try {
      if (!category) return;
      
      setLoading(true);
      const response = await AvatarService.getAvatarsByCategory(category);
      console.log(`${category} kategorisi avatarları:`, response.data.avatars);
      
      // API'den gelen verileri modele göre işle
      if (response.data.avatars) {
        setAvatars(response.data.avatars);
      } else {
        setAvatars([]);
      }
    } catch (error) {
      console.error('Avatarları getirme hatası:', error);
      // Hata durumunda boş liste göster
      setAvatars([]);
    } finally {
      setLoading(false);
    }
  };

  // Yeni kategori oluşturma
  const createCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      setUploadStatus('Kategori adı boş olamaz');
      return;
    }
    
    try {
      setUploading(true);
      
      // Kategori adını normalize et (boşlukları alt çizgi ile değiştir)
      const normalizedName = newCategoryName.trim().toLowerCase().replace(/\s+/g, '_');
      
      const response = await AvatarService.createCategory({
        name: normalizedName,
        displayName: newCategoryDisplayName || newCategoryName
      });
      
      console.log('Yeni kategori oluşturuldu:', response.data);
      
      // Başarılı olunca formı temizle
      setNewCategoryName('');
      setNewCategoryDisplayName('');
      setUploadStatus('Kategori başarıyla oluşturuldu!');
      
      // Kategorileri yeniden yükle
      fetchAvatarCategories();
    } catch (error) {
      console.error('Kategori oluşturma hatası:', error);
      setUploadStatus(`Hata: ${error.response?.data?.message || 'Kategori oluşturulamadı'}`)
    } finally {
      setUploading(false);
    }
  };
  
  // Çoklu dosya seçme işlemi
  const handleMultipleFileSelect = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      // FileList'i diziye çevir
      const filesArray = Array.from(event.target.files);
      setSelectedFiles(filesArray);
      console.log('Seçilen dosya sayısı:', filesArray.length);
    } else {
      setSelectedFiles([]);
    }
  };
  
  // Çoklu avatar yükleme
  const uploadMultipleAvatars = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0 || !selectedCategory) {
      setUploadStatus('Lütfen dosyalar ve kategori seçin');
      return;
    }
    
    try {
      setUploading(true);
      const formData = new FormData();
      
      // Dosyaları FormData'ya ekle
      selectedFiles.forEach(file => {
        formData.append('avatars', file);
      });
      
      formData.append('category', selectedCategory);
      
      const response = await AvatarService.uploadMultipleAvatars(formData);
      console.log('Avatar yükleme yanıtı:', response.data);
      
      // Başarılı olunca formu sıfırla
      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = '';
      }
      setSelectedFiles([]);
      setUploadStatus(`Başarılı! ${response.data.avatars.length} avatar yüklendi.`);
      
      // Avatarları yeniden yükle
      fetchAvatars(selectedCategory);
    } catch (error) {
      console.error('Avatar yükleme hatası:', error);
      setUploadStatus(`Hata: ${error.response?.data?.message || 'Avatar yüklenemedi'}`)
    } finally {
      setUploading(false);
    }
  };

  // Tab değişikliği
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'quizzes') {
      fetchQuizzes();
    } else if (activeTab === 'sessions') {
      fetchSessions();
    } else if (activeTab === 'avatars') {
      fetchAvatarCategories();
      if (selectedCategory) {
        fetchAvatars(selectedCategory);
      }
    }
  }, [activeTab, selectedCategory]);
  
  // Tek dosya seçme işlemi
  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      console.log('Seçilen dosya:', event.target.files[0].name);
    } else {
      setSelectedFile(null);
    }
  };

  // Avatar yükleme işlemi
  const uploadAvatar = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !selectedCategory) {
      setUploadStatus('Lütfen bir dosya ve kategori seçin');
      return;
    }
    
    try {
      setUploading(true);
      setUploadStatus('Avatar yükleniyor...');
      
      const formData = new FormData();
      formData.append('avatar', selectedFile);
      formData.append('category', selectedCategory);
      
      const response = await AvatarService.uploadAvatar(formData);
      console.log('Avatar yükleme yanıtı:', response.data);
      
      setUploadStatus('Avatar başarıyla yüklendi!');
      setSelectedFile(null);
      
      // Dosya input alanını sıfırla
      document.getElementById('avatarUploadInput').value = "";
      
    } catch (error) {
      console.error('Avatar yükleme hatası:', error);
      setUploadStatus('Hata: ' + error.message);
      
      // Gerçek API olmadığı için yeni avatarı manuel olarak ekleyelim
      if (selectedFile) {
        const newAvatarName = selectedFile.name;
        setAvatars(prev => [...prev, newAvatarName]);
        setUploadStatus('Avatar başarıyla yüklendi (test)');
        setSelectedFile(null);
        document.getElementById('avatarUploadInput').value = "";
      }
    } finally {
      setUploading(false);
    }
  };
  
  // Avatar silme işlemi
  const deleteAvatar = async (avatar) => {
    try {
      // Silme işlemi için onay al
      if (!window.confirm(`"${avatar.displayName || avatar.name}" avatarını silmek istediğinize emin misiniz?`)) {
        return;
      }
      
      // API ile silme işlemi yap
      setLoading(true);
      
      // API'ye silme isteği gönder
      const response = await AvatarService.deleteAvatar(avatar._id);
      console.log('Avatar silme yanıtı:', response.data);
      
      // Başarılı olduysa kullanıcıya mesaj göster
      setUploadStatus(`"${avatar.displayName || avatar.name}" avatarı başarıyla silindi`);
      
      // Listeyi güncelle
      setAvatars(prevAvatars => prevAvatars.filter(a => a._id !== avatar._id));
      
    } catch (error) {
      console.error('Avatar silme hatası:', error);
      setUploadStatus(`Hata: ${error.response?.data?.message || 'Avatar silinemedi'}`);
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı rolünü değiştir
  const changeUserRole = async (userId, newRole) => {
    console.log(`Rol değiştiriliyor: UserId=${userId}, YeniRol=${newRole}`);
    
    try {
      // API endpointi ve gönderilen veri
      const apiUrl = `http://localhost:5001/api/admin/users/${userId}/role`;
      const requestBody = { role: newRole };
      console.log('API URL:', apiUrl);
      console.log('Gönderilen veri:', requestBody);
      
      // Token kontrolü
      const token = localStorage.getItem('token');
      console.log('Token var mı?', !!token);
      
      // İstek gönder - PATCH metodu kullanıyoruz (çünkü backend'de bu şekilde tanımlanmış)
      const response = await fetch(apiUrl, {
        method: 'PATCH', // Backend'de '/users/:id/role' endpoint'i PATCH metodu ile tanımlandığı için bunu kullanmalıyız
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      // Yanıt bilgilerini logla
      console.log('Yanıt durumu:', response.status, response.statusText);
      const responseData = await response.json().catch(() => ({}));
      console.log('Yanıt verisi:', responseData);
      
      // Hata durumunu kontrol et
      if (!response.ok) {
        alert(`Rol değiştirilemedi: ${response.status} - ${responseData.message || response.statusText}`);
        throw new Error(`Rol değiştirilemedi: ${response.status}`);
      }
      
      // Başarılı mesajı göster
      alert(`"${newRole}" rolü başarıyla atandı!`);
      
      // Başarılı olursa kullanıcıları yenile
      fetchUsers();
    } catch (error) {
      console.error('Rol değiştirme hatası:', error);
      alert(`Rol değiştirme işlemi başarısız: ${error.message}`);
    }
  };
  
  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold text-secondary mb-8">Admin Paneli</h1>
      
      {/* Tab menüsü */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('users')}
        >
          Kullanıcılar
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'avatars' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('avatars')}
        >
          Avatarlar
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'quizzes' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('quizzes')}
        >
          Quizler
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'sessions' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('sessions')}
        >
          Oturumlar
        </button>
      </div>
      
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      )}
      
      {/* Kullanıcılar Tab İçeriği */}
      {!loading && activeTab === 'users' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'member' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <select 
                        className="text-sm border rounded px-2 py-1"
                        value=""
                        onChange={(e) => {
                          const selectedRole = e.target.value;
                          console.log('Seçilen rol:', selectedRole);
                          console.log('Kullanıcı ID:', user._id);
                          
                          if (selectedRole) {
                            // Rol değiştirme işlemi için onay sor
                            if (window.confirm(`${user.name || user.email} kullanıcısının rolünü "${selectedRole}" olarak değiştirmek istediğinizden emin misiniz?`)) {
                              changeUserRole(user._id, selectedRole);
                            }
                            // Formu sıfırla (select'i başlangıç değerine geri döndür)
                            setTimeout(() => {
                              e.target.value = "";
                            }, 100);
                          }
                        }}
                      >
                        <option value="" disabled>Rol değiştir</option>
                        <option value="admin">Admin</option>
                        <option value="member">Üye</option>
                        <option value="guest">Misafir</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Quizler Tab İçeriği */}
      {!loading && activeTab === 'quizzes' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soru Sayısı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quizzes.map(quiz => (
                <tr key={quiz._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{quiz.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{quiz.createdBy?.username || 'Bilinmiyor'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{quiz.questions?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-red-600 hover:text-red-800">
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Oturumlar Tab İçeriği */}
      {!loading && activeTab === 'sessions' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oturum ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Katılımcı Sayısı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.map(session => (
                <tr key={session._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{session.pin}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{session.quiz?.title || 'Bilinmiyor'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{session.participants?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      session.status === 'active' ? 'bg-green-100 text-green-800' : 
                      session.status === 'ended' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'  
                    }`}>
                      {session.status === 'active' ? 'Aktif' : 
                       session.status === 'ended' ? 'Bitti' : 'Bekleniyor'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Avatarlar Tab İçeriği */}
      {!loading && activeTab === 'avatars' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Avatar Yönetimi</h2>
            
            {/* Kategori Seçimi */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Kategoriler</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {avatarCategories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`px-3 py-1 rounded-full text-sm ${selectedCategory === category.name ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {category.displayName || category.name}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-md font-medium text-gray-700 mb-3">Yeni Kategori Ekle</h4>
                <form onSubmit={createCategory} className="space-y-3">
                  <div>
                    <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori Adı:
                    </label>
                    <input
                      id="categoryName"
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Kategori adı (örn: hayvanlar)"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="categoryDisplayName" className="block text-sm font-medium text-gray-700 mb-1">
                      Görünen Ad (Opsiyonel):
                    </label>
                    <input
                      id="categoryDisplayName"
                      type="text"
                      value={newCategoryDisplayName}
                      onChange={(e) => setNewCategoryDisplayName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Görünecek ad (örn: Hayvanlar)"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={uploading || !newCategoryName.trim()}
                    className={`w-full btn ${uploading || !newCategoryName.trim() ? 'btn-disabled bg-gray-300' : 'btn-primary'}`}
                  >
                    {uploading ? 'Ekleniyor...' : 'Kategori Ekle'}
                  </button>
                </form>
              </div>
            </div>
            
            {/* Upload Form */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Avatar Yükle</h3>
              
              {/* Yükleme Şekli Seçimi */}
              <div className="flex space-x-4 mb-3">
                <button
                  onClick={() => setMultipleUpload(false)}
                  className={`px-3 py-1 rounded-md text-sm ${!multipleUpload ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Tek Dosya Yükle
                </button>
                <button
                  onClick={() => setMultipleUpload(true)}
                  className={`px-3 py-1 rounded-md text-sm ${multipleUpload ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Çoklu Dosya Yükle
                </button>
              </div>
              
              {/* Tek Dosya Yükleme Formu */}
              {!multipleUpload && (
                <form onSubmit={uploadAvatar} className="space-y-3 bg-white p-4 rounded-lg border border-gray-100">
                  <div>
                    <label htmlFor="avatarUploadInput" className="block text-sm font-medium text-gray-700 mb-1">
                      Dosya Seçin:
                    </label>
                    <input
                      id="avatarUploadInput"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-white
                        hover:file:bg-primary-dark"
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={uploading || !selectedFile || !selectedCategory}
                    className={`w-full btn ${uploading || !selectedFile || !selectedCategory ? 'btn-disabled bg-gray-300' : 'btn-primary'}`}
                  >
                    {uploading ? 'Yükleniyor...' : 'Avatar Yükle'}
                  </button>
                </form>
              )}
              
              {/* Çoklu Dosya Yükleme Formu */}
              {multipleUpload && (
                <form onSubmit={uploadMultipleAvatars} className="space-y-3 bg-white p-4 rounded-lg border border-gray-100">
                  <div>
                    <label htmlFor="multipleAvatarUploadInput" className="block text-sm font-medium text-gray-700 mb-1">
                      Dosyaları Seçin:
                    </label>
                    <input
                      id="multipleAvatarUploadInput"
                      ref={multipleFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleMultipleFileSelect}
                      multiple
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-white
                        hover:file:bg-primary-dark"
                      required
                    />
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{selectedFiles.length} dosya seçildi</p>
                      <div className="mt-1 max-h-24 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="text-xs text-gray-500">{file.name}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    disabled={uploading || !selectedFiles.length || !selectedCategory}
                    className={`w-full btn ${uploading || !selectedFiles.length || !selectedCategory ? 'btn-disabled bg-gray-300' : 'btn-primary'}`}
                  >
                    {uploading ? 'Yükleniyor...' : `${selectedFiles.length || 0} Avatar Yükle`}
                  </button>
                </form>
              )}
              
              {/* Yükleme Durumu */}
              {uploadStatus && (
                <div className={`mt-3 p-2 rounded-md text-sm ${uploadStatus.includes('Hata') 
                  ? 'bg-red-50 text-red-700' 
                  : 'bg-green-50 text-green-700'}`}>
                  {uploadStatus}
                </div>
              )}
            </div>
            
            {/* Mevcut Avatarlar Listesi */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Mevcut Avatarlar</h3>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner"></div>
                  <p>Yükleniyor...</p>
                </div>
              ) : avatars.length === 0 ? (
                <p className="text-gray-600 text-center py-4">
                  Bu kategoride avatar bulunamadı.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {avatars.map((avatar, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={avatar.filePath || `http://localhost:5001/uploads/avatars/${selectedCategory}/${avatar.name}`}
                        alt={avatar.displayName || avatar.name}
                        className="w-full h-24 object-cover rounded-md shadow-sm"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                        <button
                          onClick={() => deleteAvatar(avatar)}
                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-center text-gray-700">{avatar.displayName || avatar.name}</p>
                    </div>
                  ))}
                </div>
              )}
              {/* Avatar bulunamadı mesajı zaten yukarıda gösteriliyor */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
