#!/usr/bin/env python3
"""
Backend API Test Suite for Fresh Meat Hub
Tests the Node.js + Express backend endpoints
"""

import requests
import json
import sys
from typing import Dict, Any, List

# Use the production URL from frontend/.env
BASE_URL = "https://js-mongo-conversion.preview.emergentagent.com/api"

class APITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        self.created_ids = {
            'categories': [],
            'products': [],
            'orders': [],
            'pincodes': []
        }
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=30)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=30)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, timeout=30)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, timeout=30)
            else:
                return False, f"Unsupported method: {method}", 0
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
    
    def test_root_api(self):
        """Test GET /api - Root API endpoint"""
        success, data, status = self.make_request('GET', '')
        
        if success and isinstance(data, dict) and data.get('message') == 'Fresh Meat Hub API':
            self.log_test("Root API endpoint", True, f"Status: {status}, Response: {data}")
        else:
            self.log_test("Root API endpoint", False, f"Status: {status}, Response: {data}")
    
    def test_admin_auth(self):
        """Test POST /api/admin/verify - Admin authentication"""
        # Test valid PIN
        success, data, status = self.make_request('POST', '/admin/verify', {'pin': '4242'})
        
        if success and isinstance(data, dict) and data.get('success') is True:
            self.log_test("Admin auth - Valid PIN", True, f"Status: {status}")
        else:
            self.log_test("Admin auth - Valid PIN", False, f"Status: {status}, Response: {data}")
        
        # Test invalid PIN
        success, data, status = self.make_request('POST', '/admin/verify', {'pin': '1234'})
        
        if not success and status == 401:
            self.log_test("Admin auth - Invalid PIN", True, f"Status: {status} (Expected 401)")
        else:
            self.log_test("Admin auth - Invalid PIN", False, f"Status: {status}, Expected 401, Response: {data}")
    
    def test_init_data(self):
        """Test POST /api/init-data - Initialize default data"""
        success, data, status = self.make_request('POST', '/init-data')
        
        if success and isinstance(data, dict) and 'message' in data:
            self.log_test("Initialize data", True, f"Status: {status}, Message: {data.get('message')}")
        else:
            self.log_test("Initialize data", False, f"Status: {status}, Response: {data}")
    
    def test_categories_crud(self):
        """Test Categories CRUD operations"""
        # GET all categories
        success, data, status = self.make_request('GET', '/categories')
        
        if success and isinstance(data, list):
            self.log_test("Categories - GET all", True, f"Status: {status}, Count: {len(data)}")
        else:
            self.log_test("Categories - GET all", False, f"Status: {status}, Response: {data}")
        
        # POST create category
        test_category = {'name': 'Test Category API'}
        success, data, status = self.make_request('POST', '/categories', test_category)
        
        if success and isinstance(data, dict) and 'id' in data:
            category_id = data['id']
            self.created_ids['categories'].append(category_id)
            self.log_test("Categories - POST create", True, f"Status: {status}, ID: {category_id}")
            
            # DELETE category
            success, data, status = self.make_request('DELETE', f'/categories/{category_id}')
            
            if success and isinstance(data, dict) and data.get('success') is True:
                self.log_test("Categories - DELETE", True, f"Status: {status}")
                self.created_ids['categories'].remove(category_id)
            else:
                self.log_test("Categories - DELETE", False, f"Status: {status}, Response: {data}")
        else:
            self.log_test("Categories - POST create", False, f"Status: {status}, Response: {data}")
    
    def test_products_crud(self):
        """Test Products CRUD operations"""
        # GET all products
        success, data, status = self.make_request('GET', '/products')
        
        if success and isinstance(data, list):
            self.log_test("Products - GET all", True, f"Status: {status}, Count: {len(data)}")
        else:
            self.log_test("Products - GET all", False, f"Status: {status}, Response: {data}")
        
        # GET products by category filter
        success, data, status = self.make_request('GET', '/products', params={'category': 'Chicken'})
        
        if success and isinstance(data, list):
            chicken_products = [p for p in data if p.get('category') == 'Chicken']
            self.log_test("Products - GET by category", True, f"Status: {status}, Chicken products: {len(chicken_products)}")
        else:
            self.log_test("Products - GET by category", False, f"Status: {status}, Response: {data}")
        
        # POST create product
        test_product = {
            'name': 'Test Product API',
            'price': 100,
            'category': 'Chicken',
            'description': 'Test product for API testing'
        }
        success, data, status = self.make_request('POST', '/products', test_product)
        
        if success and isinstance(data, dict) and 'id' in data:
            product_id = data['id']
            self.created_ids['products'].append(product_id)
            self.log_test("Products - POST create", True, f"Status: {status}, ID: {product_id}")
            
            # PUT update product
            update_data = {'price': 150, 'description': 'Updated test product'}
            success, data, status = self.make_request('PUT', f'/products/{product_id}', update_data)
            
            if success and isinstance(data, dict) and data.get('price') == 150:
                self.log_test("Products - PUT update", True, f"Status: {status}, New price: {data.get('price')}")
            else:
                self.log_test("Products - PUT update", False, f"Status: {status}, Response: {data}")
            
            # DELETE product
            success, data, status = self.make_request('DELETE', f'/products/{product_id}')
            
            if success and isinstance(data, dict) and data.get('success') is True:
                self.log_test("Products - DELETE", True, f"Status: {status}")
                self.created_ids['products'].remove(product_id)
            else:
                self.log_test("Products - DELETE", False, f"Status: {status}, Response: {data}")
        else:
            self.log_test("Products - POST create", False, f"Status: {status}, Response: {data}")
    
    def test_orders_crud(self):
        """Test Orders CRUD operations"""
        # GET all orders
        success, data, status = self.make_request('GET', '/orders')
        
        if success and isinstance(data, list):
            self.log_test("Orders - GET all", True, f"Status: {status}, Count: {len(data)}")
        else:
            self.log_test("Orders - GET all", False, f"Status: {status}, Response: {data}")
        
        # POST create order
        test_order = {
            'customer_name': 'Rajesh Kumar',
            'phone': '+919876543210',
            'address': '123 MG Road, Bangalore',
            'pincode': '500001',
            'items': [
                {
                    'product_id': 'test-product-id',
                    'name': 'Chicken Breast',
                    'price': 280,
                    'quantity': 2,
                    'unit': '500g'
                }
            ],
            'total': 560
        }
        success, data, status = self.make_request('POST', '/orders', test_order)
        
        if success and isinstance(data, dict) and 'id' in data:
            order_id = data['id']
            self.created_ids['orders'].append(order_id)
            self.log_test("Orders - POST create", True, f"Status: {status}, ID: {order_id}")
            
            # PUT update order status
            status_update = {'status': 'confirmed'}
            success, data, status = self.make_request('PUT', f'/orders/{order_id}/status', status_update)
            
            if success and isinstance(data, dict) and data.get('status') == 'confirmed':
                self.log_test("Orders - PUT status update", True, f"Status: {status}, New status: confirmed")
            else:
                self.log_test("Orders - PUT status update", False, f"Status: {status}, Response: {data}")
        else:
            self.log_test("Orders - POST create", False, f"Status: {status}, Response: {data}")
    
    def test_pincodes_crud(self):
        """Test Pincodes CRUD operations"""
        # GET all pincodes
        success, data, status = self.make_request('GET', '/pincodes')
        
        if success and isinstance(data, list):
            self.log_test("Pincodes - GET all", True, f"Status: {status}, Count: {len(data)}")
        else:
            self.log_test("Pincodes - GET all", False, f"Status: {status}, Response: {data}")
        
        # POST create pincode
        test_pincode = {'code': '600001'}
        success, data, status = self.make_request('POST', '/pincodes', test_pincode)
        
        if success and isinstance(data, dict) and 'id' in data:
            pincode_id = data['id']
            self.created_ids['pincodes'].append(pincode_id)
            self.log_test("Pincodes - POST create", True, f"Status: {status}, ID: {pincode_id}")
            
            # DELETE pincode
            success, data, status = self.make_request('DELETE', f'/pincodes/{pincode_id}')
            
            if success and isinstance(data, dict) and data.get('success') is True:
                self.log_test("Pincodes - DELETE", True, f"Status: {status}")
                self.created_ids['pincodes'].remove(pincode_id)
            else:
                self.log_test("Pincodes - DELETE", False, f"Status: {status}, Response: {data}")
        else:
            self.log_test("Pincodes - POST create", False, f"Status: {status}, Response: {data}")
        
        # GET verify valid pincode
        success, data, status = self.make_request('GET', '/pincodes/verify/500001')
        
        if success and isinstance(data, dict) and data.get('valid') is True:
            self.log_test("Pincodes - Verify valid", True, f"Status: {status}, Valid: {data.get('valid')}")
        else:
            self.log_test("Pincodes - Verify valid", False, f"Status: {status}, Response: {data}")
        
        # GET verify invalid pincode
        success, data, status = self.make_request('GET', '/pincodes/verify/999999')
        
        if success and isinstance(data, dict) and data.get('valid') is False:
            self.log_test("Pincodes - Verify invalid", True, f"Status: {status}, Valid: {data.get('valid')}")
        else:
            self.log_test("Pincodes - Verify invalid", False, f"Status: {status}, Response: {data}")
    
    def cleanup(self):
        """Clean up any created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Clean up categories
        for cat_id in self.created_ids['categories']:
            self.make_request('DELETE', f'/categories/{cat_id}')
        
        # Clean up products
        for prod_id in self.created_ids['products']:
            self.make_request('DELETE', f'/products/{prod_id}')
        
        # Clean up pincodes
        for pin_id in self.created_ids['pincodes']:
            self.make_request('DELETE', f'/pincodes/{pin_id}')
        
        # Note: We don't clean up orders as they might be important for business records
    
    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting Fresh Meat Hub API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Initialize data first
        self.test_init_data()
        print()
        
        # Test all endpoints
        self.test_root_api()
        print()
        
        self.test_admin_auth()
        print()
        
        self.test_categories_crud()
        print()
        
        self.test_products_crud()
        print()
        
        self.test_orders_crud()
        print()
        
        self.test_pincodes_crud()
        print()
        
        # Cleanup
        self.cleanup()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   ❌ {result['test']}: {result['details']}")
        
        return passed == total

def main():
    """Main test runner"""
    tester = APITester()
    
    try:
        success = tester.run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        tester.cleanup()
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        tester.cleanup()
        sys.exit(1)

if __name__ == "__main__":
    main()