// NoCode Backend API Client
const BASE_URL = 'https://openapi.nocodebackend.com'
const INSTANCE = '53878_service_orders_db'
const SECRET_KEY = 'da202a5855991836c853149b2b9ba4d80e2c4db0e0f9c8324d391ee89750'

class NoCodeApiError extends Error {
  constructor(message, status, response) {
    super(message)
    this.name = 'NoCodeApiError'
    this.status = status
    this.response = response
  }
}

class NoCodeApi {
  constructor() {
    this.baseUrl = BASE_URL
    this.instance = INSTANCE
    this.secretKey = SECRET_KEY
    this.tableName = 'service_orders_public_st847291'
  }

  // Get default headers for API requests
  getHeaders(isJson = true) {
    const headers = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Accept': 'application/json'
    }
    
    if (isJson) {
      headers['Content-Type'] = 'application/json'
    }
    
    return headers
  }

  // Build URL with instance parameter
  buildUrl(endpoint) {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    url.searchParams.append('Instance', this.instance)
    return url.toString()
  }

  // Handle API response
  async handleResponse(response) {
    const contentType = response.headers.get('content-type')
    let data
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }
    } catch (error) {
      throw new NoCodeApiError('Failed to parse response', response.status, null)
    }

    if (!response.ok) {
      const message = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`
      throw new NoCodeApiError(message, response.status, data)
    }

    return data
  }

  // Create a new service order
  async createServiceOrder(orderData) {
    try {
      console.log('NoCodeApi: Creating service order:', orderData)
      
      const url = this.buildUrl(`/create/${this.tableName}`)
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(orderData)
      })

      const result = await this.handleResponse(response)
      console.log('NoCodeApi: Create response:', result)
      
      return { data: result, error: null }
    } catch (error) {
      console.error('NoCodeApi: Create error:', error)
      return { data: null, error }
    }
  }

  // Get all service orders with optional filtering
  async getServiceOrders(filters = {}) {
    try {
      console.log('NoCodeApi: Fetching service orders with filters:', filters)
      
      const url = new URL(this.buildUrl(`/read/${this.tableName}`))
      
      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value)
        }
      })

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await this.handleResponse(response)
      console.log('NoCodeApi: Get response:', result)
      
      return { data: result.data || [], error: null }
    } catch (error) {
      console.error('NoCodeApi: Get error:', error)
      return { data: [], error }
    }
  }

  // Get a single service order by ID
  async getServiceOrderById(id) {
    try {
      console.log('NoCodeApi: Fetching service order by ID:', id)
      
      const url = this.buildUrl(`/read/${this.tableName}/${id}`)
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await this.handleResponse(response)
      console.log('NoCodeApi: Get by ID response:', result)
      
      return { data: result.data, error: null }
    } catch (error) {
      console.error('NoCodeApi: Get by ID error:', error)
      return { data: null, error }
    }
  }

  // Update a service order
  async updateServiceOrder(id, updateData) {
    try {
      console.log('NoCodeApi: Updating service order:', id, updateData)
      
      const url = this.buildUrl(`/update/${this.tableName}/${id}`)
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData)
      })

      const result = await this.handleResponse(response)
      console.log('NoCodeApi: Update response:', result)
      
      return { data: result, error: null }
    } catch (error) {
      console.error('NoCodeApi: Update error:', error)
      return { data: null, error }
    }
  }

  // Delete a service order
  async deleteServiceOrder(id) {
    try {
      console.log('NoCodeApi: Deleting service order:', id)
      
      const url = this.buildUrl(`/delete/${this.tableName}/${id}`)
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      const result = await this.handleResponse(response)
      console.log('NoCodeApi: Delete response:', result)
      
      return { data: result, error: null }
    } catch (error) {
      console.error('NoCodeApi: Delete error:', error)
      return { data: null, error }
    }
  }

  // Search service orders
  async searchServiceOrders(searchData) {
    try {
      console.log('NoCodeApi: Searching service orders:', searchData)
      
      const url = this.buildUrl(`/search/${this.tableName}`)
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(searchData)
      })

      const result = await this.handleResponse(response)
      console.log('NoCodeApi: Search response:', result)
      
      return { data: result.data || [], error: null }
    } catch (error) {
      console.error('NoCodeApi: Search error:', error)
      return { data: [], error }
    }
  }

  // Get archived service orders
  async getArchivedServiceOrders() {
    try {
      const filters = {
        'archived_at[ne]': 'null'
      }
      return await this.getServiceOrders(filters)
    } catch (error) {
      console.error('NoCodeApi: Get archived error:', error)
      return { data: [], error }
    }
  }

  // Get active (non-archived) service orders
  async getActiveServiceOrders() {
    try {
      const filters = {
        'archived_at': 'null'
      }
      return await this.getServiceOrders(filters)
    } catch (error) {
      console.error('NoCodeApi: Get active error:', error)
      return { data: [], error }
    }
  }
}

// Create and export a singleton instance
const noCodeApi = new NoCodeApi()

export default noCodeApi
export { NoCodeApiError }