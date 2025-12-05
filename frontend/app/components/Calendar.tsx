'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { api } from '../../lib/api'

interface CalendarEvent {
  id: string
  event_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  life_pillar: string
}

interface CalendarProps {
  userId: string
}

const pillarColors: Record<string, { bg: string; border: string; text: string }> = {
  health: { bg: 'bg-red-500/80', border: 'border-red-400', text: 'text-red-100' },
  career: { bg: 'bg-blue-500/80', border: 'border-blue-400', text: 'text-blue-100' },
  relationships: { bg: 'bg-pink-500/80', border: 'border-pink-400', text: 'text-pink-100' },
  personal_growth: { bg: 'bg-purple-500/80', border: 'border-purple-400', text: 'text-purple-100' },
  finance: { bg: 'bg-green-500/80', border: 'border-green-400', text: 'text-green-100' },
  recreation: { bg: 'bg-yellow-500/80', border: 'border-yellow-400', text: 'text-yellow-100' }
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const LIFE_PILLARS = ['health', 'career', 'relationships', 'personal_growth', 'finance', 'recreation']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

type ViewType = 'day' | 'week' | 'month'

export default function Calendar({ userId }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>('week')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    life_pillar: 'personal_growth',
    start_time: '',
    end_time: ''
  })
  const [creating, setCreating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)


  useEffect(() => {
    fetchEvents()
  }, [userId])

  useEffect(() => {
    // Scroll to 8 AM on mount
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * 60
    }
  }, [view])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await axios.get(api.calendar.events(userId, 90))
      setEvents(response.data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeekDates = (date: Date) => {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const days: (Date | null)[] = []
    
    for (let i = 0; i < startPadding; i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate)
    if (view === 'day') newDate.setDate(currentDate.getDate() + direction)
    else if (view === 'week') newDate.setDate(currentDate.getDate() + direction * 7)
    else newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const goToToday = () => setCurrentDate(new Date())

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString()

  const handleSlotClick = (date: Date, hour: number) => {
    const start = new Date(date)
    start.setHours(hour, 0, 0, 0)
    const end = new Date(start)
    end.setHours(hour + 1)
    
    setNewEvent({
      title: '',
      description: '',
      life_pillar: 'personal_growth',
      start_time: formatDateTimeLocal(start),
      end_time: formatDateTimeLocal(end)
    })
    setShowCreateModal(true)
  }

  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title.trim()) return
    
    setCreating(true)
    try {
      const response = await axios.post(api.calendar.create(userId), {
        title: newEvent.title,
        description: newEvent.description,
        life_pillar: newEvent.life_pillar,
        start_time: new Date(newEvent.start_time).toISOString(),
        end_time: new Date(newEvent.end_time).toISOString(),
        sync_to_google: true
      })
      await fetchEvents()
      setShowCreateModal(false)
      setSelectedEvent(null)
      
      // Show sync status
      if (response.data.synced_to_google) {
        setSyncStatus({ message: `"${newEvent.title}" added to Google Calendar`, type: 'success' })
      } else {
        setSyncStatus({ message: `Event created locally (not synced to Google)`, type: 'info' })
      }
      setTimeout(() => setSyncStatus(null), 3000)
    } catch (error) {
      console.error('Error creating event:', error)
      setSyncStatus({ message: 'Failed to create event', type: 'error' })
      setTimeout(() => setSyncStatus(null), 3000)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await axios.delete(api.calendar.delete(eventId))
      await fetchEvents()
      setSelectedEvent(null)
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const handleGoogleSync = async () => {
    setSyncing(true)
    setSyncStatus({ message: 'Syncing with Google Calendar...', type: 'info' })
    
    try {
      // First check if user has Google tokens
      const debugResponse = await axios.get(api.calendar.debug(userId))
      console.log('Calendar debug:', debugResponse.data)
      
      if (!debugResponse.data.has_google_tokens) {
        setSyncStatus({ 
          message: 'No Google account linked. Please log out and sign in again with Google.', 
          type: 'error' 
        })
        setSyncing(false)
        return
      }
      
      const response = await axios.post(api.calendar.sync(userId, 30))
      console.log('Sync response:', response.data)
      await fetchEvents()
      setLastSynced(new Date())
      
      if (response.data.synced === 0) {
        setSyncStatus({ 
          message: 'Sync complete. No upcoming events found in your Google Calendar.', 
          type: 'info' 
        })
      } else {
        setSyncStatus({ 
          message: `Synced ${response.data.synced} events: ${response.data.events.slice(0, 3).join(', ')}${response.data.events.length > 3 ? '...' : ''}`, 
          type: 'success' 
        })
      }
      setTimeout(() => setSyncStatus(null), 5000)
    } catch (error: any) {
      console.error('Error syncing calendar:', error)
      const errorMsg = error.response?.data?.detail || 'Failed to sync. Make sure you signed in with Google.'
      setSyncStatus({ message: errorMsg, type: 'error' })
      setTimeout(() => setSyncStatus(null), 8000)
    } finally {
      setSyncing(false)
    }
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }

  const getEventStyle = (event: CalendarEvent) => {
    const start = new Date(event.start_time)
    const end = new Date(event.end_time)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const duration = (end.getTime() - start.getTime()) / (1000 * 60)
    return {
      top: `${startMinutes}px`,
      height: `${Math.max(duration, 30)}px`
    }
  }

  const getHeaderText = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    } else if (view === 'week') {
      const weekDates = getWeekDates(currentDate)
      const start = weekDates[0]
      const end = weekDates[6]
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`
      }
      return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
    }
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }


  // Mini calendar for sidebar
  const MiniCalendar = () => {
    const monthDates = getMonthDates(currentDate)
    return (
      <div className="bg-gray-900/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white p-1">◀</button>
          <span className="text-sm font-medium text-white">
            {MONTHS[currentDate.getMonth()].slice(0, 3)} {currentDate.getFullYear()}
          </span>
          <button onClick={() => navigate(1)} className="text-gray-400 hover:text-white p-1">▶</button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-xs text-gray-500 py-1">{d[0]}</div>
          ))}
          {monthDates.map((date, i) => (
            <button
              key={i}
              onClick={() => date && setCurrentDate(date)}
              disabled={!date}
              className={`text-xs py-1 rounded ${
                !date ? '' :
                isToday(date) ? 'bg-blue-500 text-white font-bold' :
                date.toDateString() === currentDate.toDateString() ? 'bg-blue-900/50 text-blue-300' :
                'text-gray-400 hover:bg-gray-800'
              }`}
            >
              {date?.getDate() || ''}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Week/Day time grid view
  const TimeGridView = () => {
    const dates = view === 'day' ? [currentDate] : getWeekDates(currentDate)
    
    return (
      <div className="flex flex-col h-full">
        {/* Header with dates */}
        <div className="flex border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div className="w-16 flex-shrink-0" /> {/* Time gutter */}
          {dates.map((date, i) => (
            <div key={i} className={`flex-1 text-center py-2 border-l border-gray-800 ${isToday(date) ? 'bg-blue-900/20' : ''}`}>
              <div className="text-xs text-gray-500 uppercase">{DAYS_SHORT[date.getDay()]}</div>
              <div className={`text-2xl font-light ${isToday(date) ? 'bg-blue-500 text-white w-10 h-10 rounded-full mx-auto flex items-center justify-center' : 'text-white'}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        {/* Time grid */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="flex relative" style={{ height: `${24 * 60}px` }}>
            {/* Time labels */}
            <div className="w-16 flex-shrink-0 relative">
              {HOURS.map(hour => (
                <div key={hour} className="absolute w-full text-right pr-2 text-xs text-gray-500" style={{ top: `${hour * 60 - 6}px` }}>
                  {hour > 0 && formatHour(hour)}
                </div>
              ))}
            </div>
            
            {/* Day columns */}
            {dates.map((date, dayIndex) => (
              <div key={dayIndex} className={`flex-1 relative border-l border-gray-800 ${isToday(date) ? 'bg-blue-900/5' : ''}`}>
                {/* Hour lines */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    onClick={() => handleSlotClick(date, hour)}
                    className="absolute w-full border-t border-gray-800/50 hover:bg-blue-900/20 cursor-pointer transition-colors"
                    style={{ top: `${hour * 60}px`, height: '60px' }}
                  />
                ))}
                
                {/* Current time indicator */}
                {isToday(date) && (
                  <div 
                    className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none"
                    style={{ top: `${new Date().getHours() * 60 + new Date().getMinutes()}px` }}
                  >
                    <div className="w-3 h-3 bg-red-500 rounded-full -mt-1.5 -ml-1.5" />
                  </div>
                )}
                
                {/* Events */}
                {getEventsForDate(date).map(event => {
                  const colors = pillarColors[event.life_pillar] || pillarColors.personal_growth
                  const style = getEventStyle(event)
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(event) }}
                      className={`absolute left-1 right-1 ${colors.bg} ${colors.border} border-l-4 rounded px-2 py-1 cursor-pointer hover:brightness-110 transition-all overflow-hidden z-10`}
                      style={style}
                    >
                      <div className={`text-xs font-medium ${colors.text} truncate`}>{event.title}</div>
                      <div className="text-xs text-white/70">
                        {new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }


  // Month grid view
  const MonthView = () => {
    const monthDates = getMonthDates(currentDate)
    const weeks: (Date | null)[][] = []
    for (let i = 0; i < monthDates.length; i += 7) {
      weeks.push(monthDates.slice(i, i + 7))
    }
    
    return (
      <div className="flex flex-col h-full">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-800">
          {DAYS_SHORT.map(day => (
            <div key={day} className="text-center py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        {/* Weeks */}
        <div className="flex-1 grid grid-rows-6">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-800">
              {week.map((date, dayIndex) => {
                const dayEvents = date ? getEventsForDate(date) : []
                return (
                  <div
                    key={dayIndex}
                    onClick={() => date && handleSlotClick(date, 9)}
                    className={`min-h-[100px] p-1 border-r border-gray-800 cursor-pointer hover:bg-gray-800/30 transition-colors ${
                      !date ? 'bg-gray-900/30' :
                      isToday(date) ? 'bg-blue-900/20' : ''
                    }`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm mb-1 ${
                          isToday(date) 
                            ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-medium' 
                            : 'text-gray-400'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map(event => {
                            const colors = pillarColors[event.life_pillar] || pillarColors.personal_growth
                            return (
                              <div
                                key={event.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(event) }}
                                className={`text-xs px-1 py-0.5 rounded truncate ${colors.bg} ${colors.text}`}
                              >
                                {event.title}
                              </div>
                            )
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 px-1">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm border border-gray-800 rounded-xl shadow-2xl overflow-hidden relative" style={{ height: '700px' }}>
      {/* Sync Status Notification */}
      {syncStatus && (
        <div className={`absolute top-0 left-0 right-0 z-50 px-4 py-2 text-sm text-center ${
          syncStatus.type === 'success' ? 'bg-green-600/90 text-white' :
          syncStatus.type === 'error' ? 'bg-red-600/90 text-white' :
          'bg-blue-600/90 text-white'
        }`}>
          {syncStatus.message}
        </div>
      )}
      
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-56 border-r border-gray-800 p-4 flex flex-col gap-4">
          <button
            onClick={() => { setShowCreateModal(true); setNewEvent({ ...newEvent, start_time: formatDateTimeLocal(new Date()), end_time: formatDateTimeLocal(new Date(Date.now() + 3600000)) }) }}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <span className="text-2xl leading-none">+</span>
            <span>Create</span>
          </button>
          
          {/* Google Calendar Sync */}
          <button
            onClick={handleGoogleSync}
            disabled={syncing}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                </svg>
                <span>Sync Google</span>
              </>
            )}
          </button>
          
          {lastSynced && (
            <div className="text-xs text-gray-500 text-center -mt-2">
              Last synced: {lastSynced.toLocaleTimeString()}
            </div>
          )}
          
          <MiniCalendar />
          
          {/* Pillar legend */}
          <div className="mt-auto">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Categories</div>
            <div className="space-y-1">
              {LIFE_PILLARS.map(pillar => {
                const colors = pillarColors[pillar]
                return (
                  <div key={pillar} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className={`w-3 h-3 rounded ${colors.bg}`} />
                    <span className="capitalize">{pillar.replace('_', ' ')}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>


        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-4 py-1.5 border border-gray-700 rounded-md text-sm text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Today
              </button>
              <div className="flex">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:bg-gray-800 rounded-l-md transition-colors">
                  ◀
                </button>
                <button onClick={() => navigate(1)} className="p-2 text-gray-400 hover:bg-gray-800 rounded-r-md transition-colors">
                  ▶
                </button>
              </div>
              <h2 className="text-xl font-normal text-white ml-4">{getHeaderText()}</h2>
            </div>
            
            <div className="flex bg-gray-800 rounded-lg p-0.5">
              {(['day', 'week', 'month'] as ViewType[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors capitalize ${
                    view === v ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          
          {/* Calendar view */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
            ) : view === 'month' ? (
              <MonthView />
            ) : (
              <TimeGridView />
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-medium text-white">Add Event</h3>
            </div>
            <form onSubmit={handleCreateEvent} className="p-4 space-y-4">
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Add title"
                className="w-full bg-transparent border-b border-gray-700 text-xl text-white placeholder-gray-500 py-2 focus:outline-none focus:border-blue-500"
                autoFocus
                required
              />
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Start</label>
                  <input
                    type="datetime-local"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">End</label>
                  <input
                    type="datetime-local"
                    value={newEvent.end_time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Category</label>
                <div className="flex flex-wrap gap-2">
                  {LIFE_PILLARS.map(pillar => {
                    const colors = pillarColors[pillar]
                    const isSelected = newEvent.life_pillar === pillar
                    return (
                      <button
                        key={pillar}
                        type="button"
                        onClick={() => setNewEvent(prev => ({ ...prev, life_pillar: pillar }))}
                        className={`px-3 py-1.5 rounded-full text-xs capitalize transition-all ${
                          isSelected ? `${colors.bg} text-white` : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {pillar.replace('_', ' ')}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add description"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm placeholder-gray-500 h-20 resize-none focus:outline-none focus:border-blue-500"
              />
              
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newEvent.title.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md">
            <div className={`h-2 rounded-t-lg ${pillarColors[selectedEvent.life_pillar]?.bg || 'bg-gray-600'}`} />
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-medium text-white">{selectedEvent.title}</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-400">
                  <span>🕐</span>
                  <div>
                    <div>{new Date(selectedEvent.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                    <div>
                      {new Date(selectedEvent.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {' - '}
                      {new Date(selectedEvent.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-gray-400">
                  <span>🏷️</span>
                  <span className="capitalize">{selectedEvent.life_pillar.replace('_', ' ')}</span>
                </div>
                
                {selectedEvent.description && (
                  <div className="flex items-start gap-3 text-gray-400">
                    <span>📝</span>
                    <p>{selectedEvent.description}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-800">
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.event_id)}
                  className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
