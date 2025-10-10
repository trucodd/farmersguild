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
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Camera className="h-12 w-12 text-accent-meadow mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Disease Detection</h2>
          <p className="text-text-secondary">Upload a photo of your {crop.name} for AI-powered disease analysis</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/90 backdrop-blur-sm border-2 border-dashed border-accent-sage/30 rounded-lg p-8 text-center hover:border-accent-sage/50 transition-colors shadow-sm">
              {selectedImage ? (
                <div className="space-y-4">
                  <img
                    src={selectedImage}
                    alt="Uploaded crop"
                    className="max-w-full h-48 object-cover mx-auto rounded-lg"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-sm text-text-secondary hover:text-text-primary"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-accent-sage mx-auto mb-4" />
                  <p className="text-text-secondary mb-4">Drop your image here or click to browse</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="accent-button px-6 py-2 rounded-lg cursor-pointer inline-block"
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
                className="w-full accent-button py-3 rounded-lg disabled:opacity-50"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze for Diseases'}
              </button>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6 min-h-96">
            {isAnalyzing && (
              <div className="bg-white/90 backdrop-blur-sm border border-accent-sage/30 rounded-lg p-6 text-center shadow-sm">
                <div className="animate-spin w-8 h-8 border-4 border-accent-meadow border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-text-primary font-medium">Analyzing your {crop.name} image...</p>
                <p className="text-text-secondary text-sm mt-2">This may take a few moments</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="bg-white/90 backdrop-blur-sm border border-accent-sage/30 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    {result.disease === 'Healthy' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    )}
                    <h3 className="text-lg font-semibold text-text-primary">Detection Result</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-text-secondary">Disease Detected</p>
                      <p className="font-semibold text-text-primary">{result.disease}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-text-secondary">Confidence Level</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-accent-meadow h-2 rounded-full" 
                            style={{ width: `${result.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{result.confidence}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-text-secondary">Severity</p>
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

                <div className="bg-white/90 backdrop-blur-sm border border-accent-sage/30 rounded-lg p-6 shadow-sm">
                  <h4 className="font-semibold text-text-primary mb-3">Recommended Treatment</h4>
                  <p className="text-text-secondary">{result.treatment}</p>
                </div>
              </div>
            )}

            {!selectedImage && !isAnalyzing && !result && (
              <div className="bg-white/90 backdrop-blur-sm border border-accent-sage/30 rounded-lg p-6 text-center shadow-sm">
                <p className="text-text-secondary">Upload an image to get started with disease detection</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiseaseDetection