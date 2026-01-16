import requests
import sys
import json
import base64
import io
from datetime import datetime

class BeatStoreAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = []

    def log_test(self, name, success, details="", endpoint=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": details
            })
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "endpoint": endpoint
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)
        
        if files:
            # Remove Content-Type for file uploads
            test_headers.pop('Content-Type', None)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True, endpoint=endpoint)
                try:
                    return response.json() if response.content else {}
                except:
                    return {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg, endpoint)
                return {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}", endpoint)
            return {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test("Health Check", "GET", "", 200)

    def test_register_producer(self):
        """Test producer registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        producer_data = {
            "email": f"producer_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": f"Producer {timestamp}",
            "user_type": "producer"
        }
        
        result = self.run_test("Register Producer", "POST", "auth/register", 200, producer_data)
        if result and 'token' in result:
            self.producer_token = result['token']
            self.producer_data = result['user']
            return True
        return False

    def test_register_artist(self):
        """Test artist registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        artist_data = {
            "email": f"artist_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": f"Artist {timestamp}",
            "user_type": "artist"
        }
        
        result = self.run_test("Register Artist", "POST", "auth/register", 200, artist_data)
        if result and 'token' in result:
            self.artist_token = result['token']
            self.artist_data = result['user']
            return True
        return False

    def test_login(self):
        """Test login with producer credentials"""
        if not hasattr(self, 'producer_data'):
            return False
            
        login_data = {
            "email": self.producer_data['email'],
            "password": "TestPass123!"
        }
        
        result = self.run_test("Login", "POST", "auth/login", 200, login_data)
        if result and 'token' in result:
            self.token = result['token']
            self.user_data = result['user']
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_create_beat(self):
        """Test beat creation"""
        if not self.token:
            return False

        # Create a simple audio file (base64 encoded)
        audio_content = b"fake_audio_content_for_testing"
        
        beat_data = {
            'title': 'Test Beat',
            'genre': 'Hip Hop',
            'bpm': '140',
            'key': 'C',
            'description': 'A test beat for API testing',
            'price': '99.90',
            'license_type': 'non_exclusive',
            'tags': 'test, api, hip hop'
        }
        
        files = {
            'audio_file': ('test_beat.mp3', audio_content, 'audio/mpeg')
        }
        
        result = self.run_test("Create Beat", "POST", "beats", 200, beat_data, files)
        if result and 'beat' in result:
            self.beat_id = result['beat']['id']
            return True
        return False

    def test_get_beats(self):
        """Test get beats list"""
        return self.run_test("Get Beats List", "GET", "beats", 200)

    def test_get_beat_detail(self):
        """Test get beat by ID"""
        if not hasattr(self, 'beat_id'):
            return False
        return self.run_test("Get Beat Detail", "GET", f"beats/{self.beat_id}", 200)

    def test_get_producer_beats(self):
        """Test get producer's beats"""
        if not hasattr(self, 'producer_data'):
            return False
        return self.run_test("Get Producer Beats", "GET", f"beats/producer/{self.producer_data['id']}", 200)

    def test_purchase_beat(self):
        """Test beat purchase by artist"""
        if not hasattr(self, 'beat_id') or not hasattr(self, 'artist_token'):
            return False
            
        # Switch to artist token
        original_token = self.token
        self.token = self.artist_token
        
        purchase_data = {
            "beat_id": self.beat_id,
            "payment_method": "stripe"
        }
        
        result = self.run_test("Purchase Beat", "POST", "purchases", 200, purchase_data)
        
        # Switch back to original token
        self.token = original_token
        
        if result and 'purchase' in result:
            self.purchase_id = result['purchase']['id']
            return True
        return False

    def test_get_my_purchases(self):
        """Test get artist's purchases"""
        if not hasattr(self, 'artist_token'):
            return False
            
        # Switch to artist token
        original_token = self.token
        self.token = self.artist_token
        
        result = self.run_test("Get My Purchases", "GET", "purchases/my-purchases", 200)
        
        # Switch back to original token
        self.token = original_token
        return result

    def test_get_my_sales(self):
        """Test get producer's sales"""
        return self.run_test("Get My Sales", "GET", "purchases/my-sales", 200)

    def test_create_project(self):
        """Test project creation"""
        if not hasattr(self, 'beat_id') or not hasattr(self, 'artist_token'):
            return False
            
        # Switch to artist token
        original_token = self.token
        self.token = self.artist_token
        
        project_data = {
            "title": "Test Project",
            "beat_id": self.beat_id,
            "description": "A test project for API testing"
        }
        
        result = self.run_test("Create Project", "POST", "projects", 200, project_data)
        
        # Switch back to original token
        self.token = original_token
        
        if result and 'project' in result:
            self.project_id = result['project']['id']
            return True
        return False

    def test_get_my_projects(self):
        """Test get artist's projects"""
        if not hasattr(self, 'artist_token'):
            return False
            
        # Switch to artist token
        original_token = self.token
        self.token = self.artist_token
        
        result = self.run_test("Get My Projects", "GET", "projects/my-projects", 200)
        
        # Switch back to original token
        self.token = original_token
        return result

    def test_get_dashboard_stats(self):
        """Test dashboard statistics"""
        return self.run_test("Get Dashboard Stats", "GET", "stats/dashboard", 200)

    def test_ai_analyze(self):
        """Test AI analysis"""
        ai_data = {
            "prompt": "How can I improve the mixing of my hip hop beat?",
            "context": "I have a trap beat with heavy 808s"
        }
        return self.run_test("AI Analysis", "POST", "ai/analyze", 200, ai_data)

    def test_ai_generate_cover(self):
        """Test AI cover generation"""
        cover_data = {
            "prompt": "Dark urban hip hop album cover",
            "beat_title": "Test Beat"
        }
        return self.run_test("AI Generate Cover", "POST", "ai/generate-cover", 200, cover_data)

    def test_delete_beat(self):
        """Test beat deletion"""
        if not hasattr(self, 'beat_id'):
            return False
        return self.run_test("Delete Beat", "DELETE", f"beats/{self.beat_id}", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting BeatStore API Tests...")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Health check
        self.test_health_check()

        # Authentication tests
        if self.test_register_producer():
            if self.test_register_artist():
                if self.test_login():
                    self.test_get_me()

                    # Beat management tests
                    if self.test_create_beat():
                        self.test_get_beats()
                        self.test_get_beat_detail()
                        self.test_get_producer_beats()

                        # Purchase and project tests
                        if self.test_purchase_beat():
                            self.test_get_my_purchases()
                            self.test_get_my_sales()
                            
                            if self.test_create_project():
                                self.test_get_my_projects()

                        # Stats and AI tests
                        self.test_get_dashboard_stats()
                        self.test_ai_analyze()
                        self.test_ai_generate_cover()

                        # Cleanup
                        self.test_delete_beat()

        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  • {test['test']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = BeatStoreAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "failed_tests": len(tester.failed_tests),
        "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
        "test_details": tester.test_results,
        "failed_test_details": tester.failed_tests
    }
    
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())