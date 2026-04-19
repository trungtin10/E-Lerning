import React, { useState } from 'react';
import UserLayout from '../../components/layout/UserLayout';
import { 
  MessageSquare, Heart, Share2, MoreHorizontal, 
  Image as ImageIcon, Link as LinkIcon, Send, 
  TrendingUp, Users, Award, Zap
} from 'lucide-react';

const Community = () => {
  const [activeTab, setActiveTab] = useState('latest');

  const categories = [
    { name: 'Thảo luận chung', icon: <MessageSquare size={16} />, color: 'primary' },
    { name: 'Hỏi đáp kỹ thuật', icon: <Zap size={16} />, color: 'warning' },
    { name: 'Showcase dự án', icon: <Award size={16} />, color: 'success' },
    { name: 'Việc làm & Internship', icon: <Users size={16} />, color: 'info' },
  ];

  const posts = [
    {
      id: 1,
      author: 'Minh Anh',
      role: 'Student',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      time: '2 giờ trước',
      category: 'Hỏi đáp kỹ thuật',
      content: 'Mọi người cho mình hỏi về lỗi CORS khi deploy React app lên Vercel và kết nối với Express API trên Render với ạ. Mình đã cài middleware cors rồi nhưng vẫn bị lỗi 403.',
      likes: 12,
      comments: 5,
      hasImage: false
    },
    {
      id: 2,
      author: 'Hoàng Nam',
      role: 'Instructor',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      time: '5 giờ trước',
      category: 'Thông báo',
      content: 'Chào các em, tuần tới chúng ta sẽ có buổi Workshop về Clean Code trong React. Các em có thể đăng ký tham gia tại link đính kèm nhé!',
      likes: 45,
      comments: 18,
      hasImage: true,
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 3,
      author: 'Trần Tâm',
      role: 'Student',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      time: 'Hôm qua',
      category: 'Showcase dự án',
      content: 'Sau 3 tháng học tại hệ thống, mình vừa hoàn thành xong dự án Portfolio cá nhân đầu tay. Rất mong nhận được góp ý từ mọi người!',
      likes: 89,
      comments: 32,
      hasImage: false
    }
  ];

  return (
    <UserLayout>
      <div className="container-fluid px-md-4 px-lg-5 py-4">
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          
          <div className="row g-4">
            
            {/* Left Sidebar - Navigation */}
            <div className="col-12 col-lg-3 d-none d-lg-block">
              <div className="sticky-top" style={{ top: '100px' }}>
                <h5 className="fw-bold mb-4">Cộng đồng</h5>
                <div className="d-flex flex-column gap-1 mb-5">
                   {['latest', 'popular', 'following'].map((t) => (
                      <button 
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`btn w-100 text-start py-2 px-3 rounded-3 border-0 transition-all ${activeTab === t ? 'bg-primary bg-opacity-10 text-primary fw-bold' : 'text-secondary hover-bg-light bg-transparent'}`}
                      >
                         {t === 'latest' ? 'Mới nhất' : t === 'popular' ? 'Phổ biến' : 'Đang theo dõi'}
                      </button>
                   ))}
                </div>

                <h6 className="fw-bold mb-3 small text-muted text-uppercase" style={{ letterSpacing: '1px' }}>Chủ đề quan tâm</h6>
                <div className="d-flex flex-column gap-2">
                   {categories.map((c, idx) => (
                      <button key={idx} className="btn btn-white w-100 text-start d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3 shadow-none hover-bg-light transition-all">
                         <div className={`p-1 rounded bg-${c.color} bg-opacity-10 text-${c.color}`}>
                           {c.icon}
                         </div>
                         <span className="small fw-semibold text-secondary">{c.name}</span>
                      </button>
                   ))}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="col-12 col-lg-6">
               
               {/* Post Input Card */}
               <div className="card border-0 rounded-4 shadow-sm mb-4 p-4">
                  <div className="d-flex gap-3 mb-3">
                     <div className="rounded-circle overflow-hidden shadow-sm flex-shrink-0" style={{ width: 44, height: 44 }}>
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=100" className="w-100 h-100 object-fit-cover" />
                     </div>
                     <textarea 
                        className="form-control border-0 bg-light rounded-4 p-3 shadow-none overflow-hidden" 
                        placeholder="Bạn đang nghĩ gì? Chia sẻ ngay với cộng đồng học tập..." 
                        rows="1"
                        style={{ resize: 'none', transition: 'all 0.3s' }}
                        onFocus={(e) => { e.target.rows = 3; }}
                     ></textarea>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                     <div className="d-flex gap-2">
                        <button className="btn btn-light rounded-pill px-3 py-1 small d-flex align-items-center gap-2 border-0 text-secondary">
                           <ImageIcon size={16} /> Ảnh
                        </button>
                        <button className="btn btn-light rounded-pill px-3 py-1 small d-flex align-items-center gap-2 border-0 text-secondary">
                           <LinkIcon size={16} /> Liên kết
                        </button>
                     </div>
                     <button className="btn btn-primary rounded-pill px-4 py-1 fw-bold border-0 shadow-sm" style={{ backgroundColor: '#4c49ed' }}>
                        Đăng bài
                     </button>
                  </div>
               </div>

               {/* Feed Wrapper */}
               <div className="d-flex flex-column gap-4">
                  {posts.map((post) => (
                    <div className="card border-0 rounded-4 shadow-sm post-card overflow-hidden" key={post.id}>
                       <div className="p-4 pb-0">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                             <div className="d-flex gap-3">
                                <div className="rounded-circle overflow-hidden shadow-sm" style={{ width: 44, height: 44 }}>
                                   <img src={post.avatar} className="w-100 h-100 object-fit-cover" />
                                </div>
                                <div>
                                   <div className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                                      {post.author}
                                      {post.role === 'Instructor' && <span className="badge bg-primary bg-opacity-10 text-primary fw-normal" style={{ fontSize: '0.65rem' }}>GIẢNG VIÊN</span>}
                                   </div>
                                   <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{post.category} • {post.time}</div>
                                </div>
                             </div>
                             <button className="btn border-0 p-1 text-muted"><MoreHorizontal size={20} /></button>
                          </div>
                          <p className="mb-4 text-dark" style={{ lineHeight: 1.6 }}>{post.content}</p>
                       </div>
                       
                       {post.hasImage && (
                         <div className="px-4 mb-4">
                            <div className="rounded-4 overflow-hidden border shadow-sm">
                               <img src={post.imageUrl} className="w-100 object-fit-cover" style={{ maxHeight: '400px' }} />
                            </div>
                         </div>
                       )}

                       <div className="px-4 py-3 bg-light bg-opacity-50 d-flex justify-content-between align-items-center border-top">
                          <div className="d-flex gap-4">
                             <button className="btn btn-link p-0 text-decoration-none text-secondary d-flex align-items-center gap-2 hover-text-primary transition-all">
                                <Heart size={18} /> <span className="small fw-bold">{post.likes}</span>
                             </button>
                             <button className="btn btn-link p-0 text-decoration-none text-secondary d-flex align-items-center gap-2 hover-text-primary transition-all">
                                <MessageSquare size={18} /> <span className="small fw-bold">{post.comments}</span>
                             </button>
                          </div>
                          <button className="btn btn-link p-0 text-decoration-none text-secondary d-flex align-items-center gap-2 hover-text-primary transition-all">
                             <Share2 size={18} />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Right Sidebar - Widgets */}
            <div className="col-12 col-lg-3 d-none d-lg-block">
               <div className="sticky-top" style={{ top: '100px' }}>
                  
                  {/* Trending Widget */}
                  <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
                     <h6 className="fw-bold mb-4 d-flex align-items-center gap-2">
                        <TrendingUp size={18} className="text-primary" /> Xu hướng thảo luận
                     </h6>
                     <div className="d-flex flex-column gap-3">
                        {['#reactjs', '#javascript_tips', '#job_opportunity', '#ui_ux_design'].map((tag, idx) => (
                           <div key={idx} className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold small text-secondary transition-all cursor-pointer hover-text-primary">{tag}</span>
                              <span className="text-muted small" style={{ fontSize: '0.7rem' }}>{150 - idx * 25} bài viết</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Active Users Widget */}
                  <div className="card border-0 rounded-4 shadow-sm p-4">
                     <h6 className="fw-bold mb-4 d-flex align-items-center gap-2">
                        <Users size={18} className="text-success" /> Thành viên tích cực
                     </h6>
                     <div className="d-flex flex-column gap-3">
                        {[
                          { name: 'Alex Rivera', pts: 450, avatar: 'https://i.pravatar.cc/50?u=1' },
                          { name: 'Sarah Connor', pts: 320, avatar: 'https://i.pravatar.cc/50?u=2' },
                          { name: 'John Doe', pts: 210, avatar: 'https://i.pravatar.cc/50?u=3' },
                        ].map((u, idx) => (
                          <div className="d-flex align-items-center gap-3" key={idx}>
                             <div className="rounded-pill overflow-hidden border border-white shadow-sm" style={{ width: 32, height: 32 }}>
                                <img src={u.avatar} className="w-100 h-100 object-fit-cover" />
                             </div>
                             <div>
                                <div className="fw-bold small mb-0">{u.name}</div>
                                <div className="text-muted small" style={{ fontSize: '0.65rem' }}>{u.pts} điểm đóng góp</div>
                             </div>
                          </div>
                        ))}
                     </div>
                     <button className="btn btn-light w-100 mt-4 rounded-3 py-2 fw-bold small text-muted">XEM BẢNG XẾP HẠNG</button>
                  </div>

               </div>
            </div>

          </div>

        </div>
      </div>
    </UserLayout>
  );
};

export default Community;
