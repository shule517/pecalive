require "rails_helper"

describe Atom do
  let(:file) { File.open(file_name, 'r') }
  let(:atom) { Atom.new(file) }

  describe "#type" do
    let(:file_name) { 'spec/pcp/atom_pcp.txt' }
    it { expect(atom.type).to eq "pcp\n" }
  end

  describe "#size" do
    let(:file_name) { 'spec/pcp/atom_pcp.txt' }
    it { expect(atom.size).to eq 4 }
  end

  describe '#data' do
    let(:file_name) { 'spec/pcp/atom_pcp.txt' }
    it { expect(atom.data.to_a).to eq [1, 0, 0, 0] }
  end

  describe 'heloコマンド' do
    let(:file_name) { 'spec/pcp/atom_helo.txt' }

    it do
      expect(atom.type).to eq "helo"
      expect(atom.has_children?).to eq true
      expect(atom.size).to eq 4

      expect(atom.children.size).to eq 4

      atom1 = atom.children[0]
      atom2 = atom.children[1]
      atom3 = atom.children[2]
      atom4 = atom.children[3]

      expect(atom1.type).to eq "agnt"
      expect(atom1.has_children?).to eq false
      expect(atom1.size).to eq 24
      expect(atom1.data.to_s).to eq "PeerCastStation/2.9.2.0\x00"

      expect(atom2.type).to eq "ver\x00"
      expect(atom2.has_children?).to eq false
      expect(atom2.size).to eq 4
      expect(atom2.data.to_hex).to eq "C2400"

      expect(atom3.type).to eq "sid\x00"
      expect(atom3.has_children?).to eq false
      expect(atom3.size).to eq 16
      expect(atom3.data.to_hex).to eq "B99EB5E121834CFB932F15661FB4FEA"

      expect(atom4.type).to eq "bcid"
      expect(atom4.has_children?).to eq false
      expect(atom4.size).to eq 16
      expect(atom4.data.to_hex).to eq "022DD1B31E847BDAED3D92C1484213C"
    end
  end

  describe 'bcstコマンド' do
    let(:file_name) { 'spec/pcp/atom_bcst.txt' }

    it do
      expect(atom.type).to eq "bcst"
      expect(atom.has_children?).to eq true
      expect(atom.size).to eq 11
      expect(atom.children.size).to eq 11

      types = atom.children.map(&:type)
      expect(types).to eq ["ttl\x00", 'hops', 'from', 'vers', 'vrvp', 'vexp', 'vexn', "cid\x00", "grp\x00", 'chan', 'host']
    end
  end
end
