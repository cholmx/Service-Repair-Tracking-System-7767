// NoCode Backend API Client
const NOCODE_BASE_URL = 'https://openapi.nocodebackend.com'
const INSTANCE = '53878_service_orders_db'
const API_KEY = 'da202a5855991836c853149b2b9ba4d80e2c4db0e0f9c8324d391ee89750'

class NoCodeBackendClient {
  constructor() {
    this.baseURL = NOCODE_BASE_URL
    this.instance = INSTANCE
    this.apiKey = API_KEY
  }

  // Get API headers with authentication
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-API-Key': this.apiKey
    }
  }

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: this.getHeaders(),
      ...options
    }

    try {
      console.log(`API Call: ${options.method || 'GET'} ${url}`)
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('API Response:', data)
      return { data: data.data || data, error: null }
    } catch (error) {
      console.error('API Call failed:', error)
      return { data: null, error }
    }
  }

  // Service Orders API methods
  serviceOrders() {
    return {
      // SELECT - Read records
      select: (columns = '*') => ({
        // Filter methods
        eq: (column, value) => ({
          execute: async () => {
            const params = new URLSearchParams({
              Instance: this.instance,
              [column]: value
            })
            return this.apiCall(`/read/service_orders_public_st847291?${params}`)
          }
        }),
        
        // Filter by null values
        is: (column, value) => ({
          execute: async () => {
            const params = new URLSearchParams({
              Instance: this.instance
            })
            if (value === null) {
              params.append(`${column}[eq]`, '')
            }
            return this.apiCall(`/read/service_orders_public_st847291?${params}`)
          }
        }),

        // Filter by not null values
        not: (column, operator, value) => ({
          execute: async () => {
            const params = new URLSearchParams({
              Instance: this.instance
            })
            if (operator === 'is' && value === null) {
              params.append(`${column}[ne]`, '')
            }
            return this.apiCall(`/read/service_orders_public_st847291?${params}`)
          }
        }),

        // Order by - Note: NoCode Backend might not support sorting via query params
        order: (column, options = {}) => ({
          execute: async () => {
            const params = new URLSearchParams({
              Instance: this.instance
            })
            // We'll handle sorting on the client side since API doesn't specify sorting
            const result = await this.apiCall(`/read/service_orders_public_st847291?${params}`)
            if (result.data && Array.isArray(result.data)) {
              result.data.sort((a, b) => {
                const aVal = a[column]
                const bVal = b[column]
                if (options.ascending === false) {
                  return bVal > aVal ? 1 : -1
                }
                return aVal > bVal ? 1 : -1
              })
            }
            return result
          }
        }),

        // Limit results
        limit: (count) => ({
          execute: async () => {
            const params = new URLSearchParams({
              Instance: this.instance,
              limit: count
            })
            return this.apiCall(`/read/service_orders_public_st847291?${params}`)
          }
        }),

        // Get single record
        single: () => ({
          execute: async () => {
            const params = new URLSearchParams({
              Instance: this.instance,
              limit: 1
            })
            const result = await this.apiCall(`/read/service_orders_public_st847291?${params}`)
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
              return { data: result.data[0], error: null }
            }
            return { data: null, error: { code: 'PGRST116', message: 'No rows found' } }
          }
        }),

        // Execute without filters (get all)
        execute: async () => {
          const params = new URLSearchParams({
            Instance: this.instance
          })
          return this.apiCall(`/read/service_orders_public_st847291?${params}`)
        }
      }),

      // INSERT - Create records
      insert: (data) => ({
        select: () => ({
          single: () => ({
            execute: async () => {
              const params = new URLSearchParams({
                Instance: this.instance
              })
              const payload = Array.isArray(data) ? data[0] : data
              const result = await this.apiCall(`/create/service_orders_public_st847291?${params}`, {
                method: 'POST',
                body: JSON.stringify(payload)
              })
              // Return the created record (we'll return the input data since API doesn't return full record)
              return { data: payload, error: result.error }
            }
          }),
          execute: async () => {
            const params = new URLSearchParams({
              Instance: this.instance
            })
            const payload = Array.isArray(data) ? data : [data]
            return this.apiCall(`/create/service_orders_public_st847291?${params}`, {
              method: 'POST',
              body: JSON.stringify(payload[0]) // API expects single object, not array
            })
          }
        }),
        execute: async () => {
          const params = new URLSearchParams({
            Instance: this.instance
          })
          const payload = Array.isArray(data) ? data[0] : data
          return this.apiCall(`/create/service_orders_public_st847291?${params}`, {
            method: 'POST',
            body: JSON.stringify(payload)
          })
        }
      }),

      // UPDATE - Update records
      update: (data) => ({
        eq: (column, value) => ({
          select: () => ({
            single: () => ({
              execute: async () => {
                // For updates, we need to find the record first to get its ID
                const findParams = new URLSearchParams({
                  Instance: this.instance,
                  [column]: value
                })
                const findResult = await this.apiCall(`/read/service_orders_public_st847291?${findParams}`)
                
                if (findResult.data && Array.isArray(findResult.data) && findResult.data.length > 0) {
                  const recordId = findResult.data[0].service_id || findResult.data[0].id
                  const params = new URLSearchParams({
                    Instance: this.instance
                  })
                  const result = await this.apiCall(`/update/service_orders_public_st847291/${recordId}?${params}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                  })
                  // Return updated record
                  return { data: { ...findResult.data[0], ...data }, error: result.error }
                }
                return { data: null, error: { message: 'Record not found' } }
              }
            }),
            execute: async () => {
              const findParams = new URLSearchParams({
                Instance: this.instance,
                [column]: value
              })
              const findResult = await this.apiCall(`/read/service_orders_public_st847291?${findParams}`)
              
              if (findResult.data && Array.isArray(findResult.data) && findResult.data.length > 0) {
                const recordId = findResult.data[0].service_id || findResult.data[0].id
                const params = new URLSearchParams({
                  Instance: this.instance
                })
                return this.apiCall(`/update/service_orders_public_st847291/${recordId}?${params}`, {
                  method: 'PUT',
                  body: JSON.stringify(data)
                })
              }
              return { data: null, error: { message: 'Record not found' } }
            }
          }),
          execute: async () => {
            const findParams = new URLSearchParams({
              Instance: this.instance,
              [column]: value
            })
            const findResult = await this.apiCall(`/read/service_orders_public_st847291?${findParams}`)
            
            if (findResult.data && Array.isArray(findResult.data) && findResult.data.length > 0) {
              const recordId = findResult.data[0].service_id || findResult.data[0].id
              const params = new URLSearchParams({
                Instance: this.instance
              })
              return this.apiCall(`/update/service_orders_public_st847291/${recordId}?${params}`, {
                method: 'PUT',
                body: JSON.stringify(data)
              })
            }
            return { data: null, error: { message: 'Record not found' } }
          }
        })
      }),

      // DELETE - Delete records
      delete: () => ({
        eq: (column, value) => ({
          execute: async () => {
            // Find the record first to get its ID
            const findParams = new URLSearchParams({
              Instance: this.instance,
              [column]: value
            })
            const findResult = await this.apiCall(`/read/service_orders_public_st847291?${findParams}`)
            
            if (findResult.data && Array.isArray(findResult.data) && findResult.data.length > 0) {
              const recordId = findResult.data[0].service_id || findResult.data[0].id
              const params = new URLSearchParams({
                Instance: this.instance
              })
              return this.apiCall(`/delete/service_orders_public_st847291/${recordId}?${params}`, {
                method: 'DELETE'
              })
            }
            return { data: null, error: { message: 'Record not found' } }
          }
        })
      })
    }
  }

  // Status History API methods (assuming similar table exists)
  statusHistory() {
    return {
      select: (columns = '*') => ({
        eq: (column, value) => ({
          execute: async () => {
            const params = new URLSearchParams({
              Instance: this.instance,
              [column]: value
            })
            // Note: Assuming status_history table exists in NoCode Backend
            return this.apiCall(`/read/status_history_public_st847291?${params}`)
          }
        }),
        execute: async () => {
          const params = new URLSearchParams({
            Instance: this.instance
          })
          return this.apiCall(`/read/status_history_public_st847291?${params}`)
        }
      }),

      insert: (data) => ({
        execute: async () => {
          const params = new URLSearchParams({
            Instance: this.instance
          })
          const payload = Array.isArray(data) ? data[0] : data
          return this.apiCall(`/create/status_history_public_st847291?${params}`, {
            method: 'POST',
            body: JSON.stringify(payload)
          })
        }
      })
    }
  }

  // User Profiles API methods (if needed)
  userProfiles() {
    return {
      select: (columns = '*') => ({
        eq: (column, value) => ({
          single: () => ({
            execute: async () => {
              const params = new URLSearchParams({
                Instance: this.instance,
                [column]: value,
                limit: 1
              })
              const result = await this.apiCall(`/read/user_profiles_st847291?${params}`)
              if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                return { data: result.data[0], error: null }
              }
              return { data: null, error: { code: 'PGRST116', message: 'No rows found' } }
            }
          })
        })
      }),

      insert: (data) => ({
        select: () => ({
          single: () => ({
            execute: async () => {
              const params = new URLSearchParams({
                Instance: this.instance
              })
              const payload = Array.isArray(data) ? data[0] : data
              return this.apiCall(`/create/user_profiles_st847291?${params}`, {
                method: 'POST',
                body: JSON.stringify(payload)
              })
            }
          })
        })
      }),

      update: (data) => ({
        eq: (column, value) => ({
          select: () => ({
            single: () => ({
              execute: async () => {
                const findParams = new URLSearchParams({
                  Instance: this.instance,
                  [column]: value
                })
                const findResult = await this.apiCall(`/read/user_profiles_st847291?${findParams}`)
                
                if (findResult.data && Array.isArray(findResult.data) && findResult.data.length > 0) {
                  const recordId = findResult.data[0].id
                  const params = new URLSearchParams({
                    Instance: this.instance
                  })
                  const result = await this.apiCall(`/update/user_profiles_st847291/${recordId}?${params}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                  })
                  return { data: { ...findResult.data[0], ...data }, error: result.error }
                }
                return { data: null, error: { message: 'Record not found' } }
              }
            })
          })
        })
      })
    }
  }

  // Helper method to create a table interface
  from(tableName) {
    switch (tableName) {
      case 'service_orders_public_st847291':
        return this.serviceOrders()
      case 'status_history_public_st847291':
        return this.statusHistory()
      case 'user_profiles_st847291':
        return this.userProfiles()
      default:
        throw new Error(`Table ${tableName} not supported`)
    }
  }
}

// Create and export client instance
const nocodeBackend = new NoCodeBackendClient()

// Export both the client and a supabase-compatible interface
export default nocodeBackend
export const nocode = nocodeBackend

console.log('NoCode Backend client initialized with authentication:', {
  baseURL: NOCODE_BASE_URL,
  instance: INSTANCE,
  authenticated: true
})