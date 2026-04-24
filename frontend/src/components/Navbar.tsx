import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, ClipboardList,
  PlusSquare, FilePlus, Settings, LogOut, Menu, X, FolderEdit
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '' },
  { label: 'Courses', icon: BookOpen, path: '/courses' },
  { label: 'Quizzes', icon: ClipboardList, path: '/quizzes' },
]

export default function Navbar() {
  const member = useAuthStore((s) => s.member)
  const logout = useAuthStore((s) => s.logout)
  const isAdmin = member?.function === 'TM' || member?.function === 'PM'

  const handleLogout = () => {
    logout()
    window.location.href = 'https://auth.aiesec.org/users/sign_out'
  }
  const pos = member?.position?.toLowerCase() ?? ''
  const canManageContent = pos.includes('mc')
  const seeAllFunctions = pos.includes('mc') || pos.includes('lcp') || pos.includes('president')
  const fn = member?.function?.toLowerCase() || 'other'
  const base = `/${fn}`
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img
              src="https://aiesec-logos.s3.eu-west-1.amazonaws.com/White%20Watermark%20-%20Blue%20AIESEC%20Human.png"
              alt="AIESEC"
              className="w-16 h-16 object-contain mx-auto mb-4"
            />
            <span className="text-xl font-extrabold text-white tracking-tight">
              TM Hub
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {NAV.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={label}
                to={path ? `${base}${path}` : base}
                end={!path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {label}
              </NavLink>
            ))}

            {canManageContent && (
              <>
                <NavLink
                  to="/admin/courses/new"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ml-2 ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-400'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <PlusSquare size={18} className="shrink-0" />
                  Add Course
                </NavLink>
                <NavLink
                  to="/admin/quizzes/new"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-violet-600/20 text-violet-400'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <FilePlus size={18} className="shrink-0" />
                  Add Quiz
                </NavLink>
                <NavLink
                  to="/admin/manage"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-amber-600/20 text-amber-400'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <FolderEdit size={18} className="shrink-0" />
                  Manage
                </NavLink>
              </>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Settings size={18} className="shrink-0" />
                Admin
              </NavLink>
            )}
          </div>

          {/* Right Section: Profile & Logout */}
          <div className="hidden md:flex items-center gap-4 pl-6 border-l border-gray-800">
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-white">{member?.full_name?.split(' ')[0] || 'Member'}</span>
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                {member?.position || 'Member'}
              </span>
            </div>
            <div className="relative group cursor-pointer">
              {member?.profile_picture ? (
                <img src={member.profile_picture} className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-500 transition-all duration-300" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-white text-sm shadow-inner group-hover:shadow-md transition-all">
                  {member?.full_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors ml-2"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-400 hover:text-white focus:outline-none p-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900">
          <div className="px-4 py-3 space-y-1">
            {NAV.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={label}
                to={path ? `${base}${path}` : base}
                onClick={() => setMenuOpen(false)}
                end={!path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
            {canManageContent && (
              <>
                <NavLink
                  to="/admin/courses/new"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors mt-2 ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-400'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <PlusSquare size={20} />
                  Add Course
                </NavLink>
                <NavLink
                  to="/admin/quizzes/new"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-violet-600/20 text-violet-400'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <FilePlus size={20} />
                  Add Quiz
                </NavLink>
                <NavLink
                  to="/admin/manage"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-600/20 text-amber-400'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <FolderEdit size={20} />
                  Manage
                </NavLink>
              </>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                end
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Settings size={20} />
                Admin
              </NavLink>
            )}

            <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between px-3">
              <div className="flex items-center gap-3">
                {member?.profile_picture ? (
                  <img src={member.profile_picture} className="w-10 h-10 rounded-full" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
                    {member?.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-white">{member?.full_name}</p>
                  <p className="text-xs text-indigo-400 font-semibold">{member?.position}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
