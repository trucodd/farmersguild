import { useState } from 'react'
import { Upload, Camera, AlertTriangle, CheckCircle } from 'lucide-react'

const DiseaseDetection = ({ crop }) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target.result)
        setResult(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = () => {
    setIsAnalyzing(true)
    // Simulate AI analysis
    setTimeout(() => {
      setResult({
        disease: 'Leaf Blight',
        confidence: 87,
        severity: 'Moderate',
        treatment: 'Apply copper-based fungicide and improve drainage'
      })
      setIsAnalyzing(false)
    }, 3000)
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Camera className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Disease Detection</h2>
          <p className="text-gray-600">Upload a photo of your {crop.name} for AI-powered disease analysis</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              {selectedImage ? (
                <div className="space-y-4">
                  <img
                    src={selectedImage}
                    alt="Uploaded crop"
                    className="max-w-full h-48 object-cover mx-auto rounded-lg"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Drop your image here or click to browse</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer inline-block"
                  >
                    Choose Image
                  </label>
                </div>
              )}
            </div>

            {selectedImage && !result && (
              <button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze for Diseases'}
              </button>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {isAnalyzing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-blue-700 font-medium">Analyzing your {crop.name} image...</p>
                <p className="text-blue-600 text-sm mt-2">This may take a few moments</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className={`border rounded-lg p-6 ${
                  result.disease === 'Healthy' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-3 mb-4">
                    {result.disease === 'Healthy' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">Detection Result</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Disease Detected</p>
                      <p className="font-semibold text-gray-900">{result.disease}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Confidence Level</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${result.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{result.confidence}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Severity</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        result.severity === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                        result.severity === 'Moderate' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.severity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Recommended Treatment</h4>
                  <p className="text-gray-700">{result.treatment}</p>
                </div>
              </div>
            )}

            {!selectedImage && !isAnalyzing && !result && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-500">Upload an image to get started with disease detection</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiseaseDetection