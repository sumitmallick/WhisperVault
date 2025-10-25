terraform {
  backend "s3" {
    bucket = "whispervault-terraform-state-1761359186"
    key    = "terraform.tfstate"
    region = "ap-south-1"
  }
}
